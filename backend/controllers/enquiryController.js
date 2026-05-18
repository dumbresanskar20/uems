const { Enquiry, FormField, Organization, Branch, Notification, ActivityLog } = require('../models');
const { analyzeEnquiry, generateFollowUpSuggestions } = require('../services/aiService');
const { sendEnquiryConfirmation, sendEnquiryCompleted } = require('../services/emailService');
const { createObjectCsvWriter } = require('csv-writer');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Get org and branch from request
const getOrgBranch = (req) => {
  const orgId = req.user.role === 'organization' ? req.user.orgId : req.branch?.organization?._id;
  const branchId = req.user.role === 'branch' ? req.user.branchId : null;
  return { orgId, branchId };
};

// ============================================================
// CREATE ENQUIRY
// ============================================================
const createEnquiry = async (req, res) => {
  try {
    const { orgId, branchId } = getOrgBranch(req);
    const { name, email, mobile, dynamicFields, source } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });

    const enquiryData = { organization: orgId, name, email, mobile, source: source || 'manual' };
    if (branchId) enquiryData.branch = branchId;
    if (dynamicFields) enquiryData.dynamicFields = new Map(Object.entries(dynamicFields));

    const enquiry = await Enquiry.create(enquiryData);

    // Update org enquiry count
    await Organization.findByIdAndUpdate(orgId, { $inc: { totalEnquiries: 1 } });

    // Send immediate notification
    const io = req.app.get('io');
    try {
      const notification = await Notification.create({
        organization: orgId,
        branch: branchId,
        type: 'new_enquiry',
        title: 'New Enquiry Received',
        message: `A new enquiry has been received from ${name}`,
        data: { enquiryId: enquiry._id, enquiryNumber: enquiry.enquiryNumber },
        priority: 'medium',
      });
      if (io) io.to(`org_${orgId}`).emit('notification', notification);
    } catch(err) {
      console.error('Notification error', err);
    }

    // AI Analysis (async - don't wait)
    setImmediate(async () => {
      try {
        const aiResult = await analyzeEnquiry(enquiry);
        if (aiResult) {
          await Enquiry.findByIdAndUpdate(enquiry._id, {
            aiSummary: aiResult.summary,
            aiPriorityScore: aiResult.priorityScore,
            aiSuggestedActions: aiResult.suggestedActions || [],
            aiAnalyzed: true,
            priority: aiResult.priority || enquiry.priority,
          });

          // Create urgent notification if needed
          if (aiResult.priority === 'urgent' || aiResult.priorityScore > 80) {
            const io = req.app.get('io');
            const notification = await Notification.create({
              organization: orgId,
              branch: branchId,
              type: 'urgent_enquiry',
              title: '🚨 Urgent Enquiry Detected',
              message: `AI detected urgent enquiry from ${name}`,
              data: { enquiryId: enquiry._id, enquiryNumber: enquiry.enquiryNumber },
              priority: 'urgent',
            });
            if (io) io.to(`org_${orgId}`).emit('notification', notification);
          }
        }
      } catch (aiErr) {
        console.error('AI analysis error:', aiErr.message);
      }
    });

    // Send confirmation email (async)
    if (email) {
      setImmediate(async () => {
        try {
          const org = await Organization.findById(orgId);
          const branch = branchId ? await Branch.findById(branchId) : null;
          await sendEnquiryConfirmation(enquiry, org, branch);
        } catch (emailErr) {
          console.error('Email error:', emailErr.message);
        }
      });
    }

    // Emit real-time update
    if (io) io.to(`org_${orgId}`).emit('new_enquiry', enquiry);

    // Activity log
    await ActivityLog.create({
      organization: orgId,
      branch: branchId,
      actor: req.user.email,
      actorRole: req.user.role,
      action: 'CREATE_ENQUIRY',
      entity: 'enquiry',
      entityId: enquiry._id,
    });

    res.status(201).json({ success: true, message: 'Enquiry created successfully.', enquiry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// GET ALL ENQUIRIES
// ============================================================
const getEnquiries = async (req, res) => {
  try {
    const { orgId, branchId } = getOrgBranch(req);
    const { page = 1, limit = 20, status, priority, search, startDate, endDate, branch } = req.query;

    const filter = { organization: orgId };
    if (branchId) filter.branch = branchId;
    else if (branch) filter.branch = branch;
    if (status) filter.status = status;
    if (priority) {
      filter.priority = priority;
      if (priority === 'urgent' && !status) {
        filter.status = { $nin: ['completed', 'cancelled'] };
      }
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { enquiryNumber: { $regex: search, $options: 'i' } },
      ];
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const total = await Enquiry.countDocuments(filter);
    const enquiries = await Enquiry.find(filter)
      .populate('branch', 'name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      enquiries,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// GET SINGLE ENQUIRY
// ============================================================
const getEnquiry = async (req, res) => {
  try {
    const { orgId } = getOrgBranch(req);
    const enquiry = await Enquiry.findOne({ _id: req.params.id, organization: orgId })
      .populate('branch', 'name code location');

    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found.' });

    // Get follow-up suggestions if not already analyzed
    if (enquiry.aiAnalyzed && (!enquiry.aiSuggestedActions || enquiry.aiSuggestedActions.length === 0)) {
      const suggestions = await generateFollowUpSuggestions(enquiry);
      enquiry.aiSuggestedActions = suggestions;
    }

    res.json({ success: true, enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// UPDATE ENQUIRY
// ============================================================
const updateEnquiry = async (req, res) => {
  try {
    const { orgId } = getOrgBranch(req);
    const updates = req.body;
    const prevEnquiry = await Enquiry.findOne({ _id: req.params.id, organization: orgId });
    if (!prevEnquiry) return res.status(404).json({ success: false, message: 'Enquiry not found.' });

    // Handle status transitions
    if (updates.status === 'completed' && prevEnquiry.status !== 'completed') {
      updates.completedAt = new Date();
    }
    if (updates.status === 'cancelled' && prevEnquiry.status !== 'cancelled') {
      updates.cancelledAt = new Date();
    }

    if (updates.dynamicFields) {
      updates.dynamicFields = new Map(Object.entries(updates.dynamicFields));
    }

    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, updates, { new: true });

    // Send completion email
    if (updates.status === 'completed' && prevEnquiry.status !== 'completed' && enquiry.email) {
      setImmediate(async () => {
        const org = await Organization.findById(orgId);
        const branch = enquiry.branch ? await Branch.findById(enquiry.branch) : null;
        await sendEnquiryCompleted(enquiry, org, branch);
      });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) io.to(`org_${orgId}`).emit('enquiry_updated', enquiry);

    res.json({ success: true, enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// DELETE ENQUIRY
// ============================================================
const deleteEnquiry = async (req, res) => {
  try {
    const { orgId } = getOrgBranch(req);
    const enquiry = await Enquiry.findOneAndDelete({ _id: req.params.id, organization: orgId });
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    res.json({ success: true, message: 'Enquiry deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// ADD NOTE TO ENQUIRY
// ============================================================
const addNote = async (req, res) => {
  try {
    const { orgId } = getOrgBranch(req);
    const { text } = req.body;
    const enquiry = await Enquiry.findOneAndUpdate(
      { _id: req.params.id, organization: orgId },
      { $push: { notes: { text, addedBy: req.user.email } } },
      { new: true }
    );
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    res.json({ success: true, enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// PIPELINE - Get enquiries grouped by status
// ============================================================
const getPipeline = async (req, res) => {
  try {
    const { orgId, branchId } = getOrgBranch(req);
    const filter = { organization: orgId };
    if (branchId) filter.branch = branchId;

    const statuses = ['new', 'contacted', 'in_progress', 'follow_up', 'completed', 'cancelled'];
    const pipeline = {};

    for (const status of statuses) {
      pipeline[status] = await Enquiry.find({ ...filter, status })
        .select('name email mobile enquiryNumber priority aiSummary createdAt branch')
        .populate('branch', 'name code')
        .sort({ createdAt: -1 })
        .limit(50);
    }

    res.json({ success: true, pipeline });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// DASHBOARD STATS
// ============================================================
const getDashboardStats = async (req, res) => {
  try {
    const { orgId, branchId } = getOrgBranch(req);
    const filter = { organization: orgId };
    if (branchId) filter.branch = branchId;

    const mongoose = require('mongoose');
    const aggFilter = { organization: new mongoose.Types.ObjectId(orgId) };
    if (branchId) aggFilter.branch = new mongoose.Types.ObjectId(branchId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    const [total, thisMonth, urgent, completed, byStatus, recentEnquiries, monthlyTrend] = await Promise.all([
      Enquiry.countDocuments(filter),
      Enquiry.countDocuments({ ...filter, createdAt: { $gte: startOfMonth } }),
      Enquiry.countDocuments({ ...filter, priority: 'urgent', status: { $ne: 'completed' } }),
      Enquiry.countDocuments({ ...filter, status: 'completed' }),
      Enquiry.aggregate([
        { $match: aggFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Enquiry.find(filter).sort({ createdAt: -1 }).limit(5).select('name email status priority createdAt enquiryNumber'),
      Enquiry.aggregate([
        { $match: { ...aggFilter, createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const conversionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      stats: {
        total,
        thisMonth,
        urgent,
        completed,
        conversionRate,
        byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
        recentEnquiries,
        monthlyTrend,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// EXPORT ENQUIRIES
// ============================================================
const exportEnquiries = async (req, res) => {
  try {
    const { orgId, branchId } = getOrgBranch(req);
    const { format = 'csv', status, startDate, endDate } = req.query;

    const filter = { organization: orgId };
    if (branchId) filter.branch = branchId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const enquiries = await Enquiry.find(filter)
      .populate('branch', 'name code')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      const csvData = enquiries.map(e => ({
        'Enquiry #': e.enquiryNumber,
        Name: e.name,
        Email: e.email || '',
        Mobile: e.mobile || '',
        Status: e.status,
        Priority: e.priority,
        Branch: e.branch?.name || 'Main',
        'Created At': new Date(e.createdAt).toLocaleDateString(),
        'AI Summary': e.aiSummary || '',
      }));

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=enquiries.csv');
      return res.send(csvContent);
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 40 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=enquiries.pdf');
      doc.pipe(res);

      const org = await Organization.findById(orgId).select('name');
      doc.fontSize(20).text(`${org.name} - Enquiry Report`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();

      enquiries.forEach((e, i) => {
        doc.fontSize(12).fillColor('#667eea').text(`${i + 1}. ${e.enquiryNumber} - ${e.name}`);
        doc.fontSize(10).fillColor('#333')
          .text(`   Email: ${e.email || 'N/A'} | Mobile: ${e.mobile || 'N/A'}`)
          .text(`   Status: ${e.status} | Priority: ${e.priority}`)
          .text(`   Date: ${new Date(e.createdAt).toLocaleDateString()}`);
        if (e.aiSummary) doc.text(`   AI: ${e.aiSummary}`);
        doc.moveDown(0.5);
      });

      doc.end();
      return;
    }

    res.json({ success: true, enquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  createEnquiry,
  getEnquiries,
  getEnquiry,
  updateEnquiry,
  deleteEnquiry,
  addNote,
  getPipeline,
  getDashboardStats,
  exportEnquiries,
};
