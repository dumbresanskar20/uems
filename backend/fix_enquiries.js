require('dotenv').config();
const mongoose = require('mongoose');
const { Enquiry } = require('./models');
const { analyzeEnquiry } = require('./services/aiService');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const pending = await Enquiry.find({ aiAnalyzed: { $ne: true } });
  console.log(`Found ${pending.length} pending enquiries.`);
  for (let enq of pending) {
    console.log(`Analyzing ${enq.name}...`);
    const aiResult = await analyzeEnquiry(enq);
    if (aiResult) {
      await Enquiry.findByIdAndUpdate(enq._id, {
        aiSummary: aiResult.summary,
        aiPriorityScore: aiResult.priorityScore,
        aiSuggestedActions: aiResult.suggestedActions || [],
        aiAnalyzed: true,
        priority: aiResult.priority || enq.priority
      });
      console.log(`Success for ${enq.name}`);
    } else {
      console.log(`Failed for ${enq.name}`);
    }
  }
  console.log('Done!');
  process.exit(0);
});
