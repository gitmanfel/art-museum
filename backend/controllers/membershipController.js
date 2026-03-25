const db = require('../db');
const jwt = require('jsonwebtoken');

// Get all membership tiers
exports.getMembershipTiers = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM membership_tiers ORDER BY price ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching membership tiers:', error);
    res.status(500).json({ message: 'Server error fetching membership tiers' });
  }
};

// Purchase / Upgrade Membership
exports.purchaseMembership = async (req, res) => {
  const userId = req.user.id;
  const { tierId } = req.body;

  if (!tierId) {
    return res.status(400).json({ message: 'Membership tier ID is required' });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // 1. Verify the tier exists
    const tierResult = await client.query('SELECT * FROM membership_tiers WHERE id = $1', [tierId]);
    if (tierResult.rows.length === 0) {
      throw new Error('Invalid membership tier');
    }

    const tier = tierResult.rows[0];

    // 2. Update the user record to reflect the new membership status and expiration (1 year from now)
    const updateUserQuery = `
      UPDATE users
      SET role = 'member',
          membership_tier_id = $1,
          membership_expires_at = NOW() + INTERVAL '1 year'
      WHERE id = $2
      RETURNING id, email, role;
    `;
    const userResult = await client.query(updateUserQuery, [tier.id, userId]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found during upgrade');
    }

    const updatedUser = userResult.rows[0];

    await client.query('COMMIT');

    // 3. Generate a NEW JWT that includes the updated role ('member') for RBAC
    const newToken = jwt.sign(
      { id: updatedUser.id, role: updatedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: `Successfully upgraded to ${tier.name} Membership!`,
      token: newToken,
      user: updatedUser
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error purchasing membership:', error);
    res.status(500).json({ message: error.message || 'Server error purchasing membership' });
  } finally {
    client.release();
  }
};
