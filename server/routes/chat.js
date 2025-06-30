const express = require('express');
const supabase = require('../utils/supabase');
const { PRICING } = require('../utils/constants');
const { logError, trackPerformance } = require('../utils/monitoring');

const router = express.Router();

router.post('/message', async (req, res) => {
  const { wallet_address, message_content, is_initial_prompt } = req.body;

  if (!wallet_address || !message_content) {
    return res.status(400).json({ error: 'Wallet address and message content are required.' });
  }

  const startTime = process.hrtime.bigint();

  try {
    // Fetch user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', wallet_address)
      .single();

    if (userError) {
      logError('Error fetching user for chat message:', userError, { wallet_address });
      return res.status(500).json({ error: 'User not found or database error.' });
    }

    let cost = is_initial_prompt ? PRICING.INITIAL_PROMPT : PRICING.FOLLOW_UP;

    // Check for free messages
    if (user.free_messages_remaining > 0) {
      cost = 0; // Free message, no cost
    } else if (user.credits < cost) {
      return res.status(402).json({ error: 'Insufficient credits.' });
    }

    // Deduct credits/free messages and update messages_used
    let updatedCredits = user.credits;
    let updatedFreeMessagesRemaining = user.free_messages_remaining;

    if (cost === 0 && user.free_messages_remaining > 0) {
      updatedFreeMessagesRemaining -= 1;
    } else {
      updatedCredits -= cost;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        credits: updatedCredits,
        messages_used: user.messages_used + 1,
        free_messages_remaining: updatedFreeMessagesRemaining
      })
      .eq('id', user.id);

    if (updateError) {
      logError('Error updating user credits/messages_used:', updateError, { userId: user.id });
      return res.status(500).json({ error: 'Failed to update user data.' });
    }

    // Simulate AI response
    const aiResponse = `AI response to: "${message_content}"`;
    const tokensUsed = message_content.length + aiResponse.length; // Simple token count

    // Record prompt
    const { error: promptError } = await supabase
      .from('prompts')
      .insert([
        {
          user_id: user.id,
          content: message_content,
          response: aiResponse,
          tokens: tokensUsed,
          cost: cost
        }
      ]);

    if (promptError) {
      logError('Error recording prompt:', promptError, { userId: user.id, message_content });
      // This error is not critical enough to fail the user's request, but should be logged.
    }

    const endTime = process.hrtime.bigint();
    trackPerformance('chat_message_processing', Number(endTime - startTime) / 1_000_000, { userId: user.id });

    res.status(200).json({
      response: aiResponse,
      remainingCredits: updatedCredits,
      remainingFreeMessages: updatedFreeMessagesRemaining
    });

  } catch (error) {
    logError('Unexpected error in chat message processing:', error, { wallet_address, message_content });
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
