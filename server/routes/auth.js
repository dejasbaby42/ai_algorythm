const express = require('express');
const supabase = require('../utils/supabase');
const { logError } = require('../utils/monitoring');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { wallet_address } = req.body;

  if (!wallet_address) {
    return res.status(400).json({ error: 'Wallet address is required.' });
  }

  try {
    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', wallet_address)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
      logError('Error checking existing user:', fetchError, { wallet_address });
      return res.status(500).json({ error: 'Failed to check user existence.' });
    }

    if (existingUser) {
      return res.status(409).json({ message: 'User already registered.' });
    }

    // Register new user with initial free messages
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          wallet_address: wallet_address,
          credits: 5, // Automatic 5 free messages allocation
          tier: 'free',
          messages_used: 0,
          free_messages_remaining: 5
        }
      ])
      .select()
      .single();

    if (error) {
      logError('Error registering user:', error, { wallet_address });
      return res.status(500).json({ error: 'Failed to register user.' });
    }

    res.status(201).json({ message: 'User registered successfully.', user: data });
  } catch (error) {
    logError('Unexpected error during registration:', error, { wallet_address });
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get user profile (e.g., credits, tier)
router.get('/profile/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return res.status(404).json({ error: 'User not found.' });
      }
      logError('Error fetching user profile:', error, { walletAddress });
      return res.status(500).json({ error: 'Failed to fetch user profile.' });
    }

    res.status(200).json({ user: data });
  } catch (error) {
    logError('Unexpected error fetching user profile:', error, { walletAddress });
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
