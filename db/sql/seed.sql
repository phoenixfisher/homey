INSERT INTO users (
  username,
  email,
  password_hash,
  first_name,
  last_name,
  desired_home_price,
  credit_score,
  monthly_income,
  monthly_expenses,
  total_savings,
  last_logged_in_at,
  created_at,
  role
)
VALUES
  (
    'buyer1',
    'buyer1@example.com',
    'test_hash_123',
    'Jane',
    'Doe',
    425000.00,
    720,
    6800.00,
    2400.00,
    55000.00,
    NULL,
    (UTC_TIMESTAMP() - INTERVAL 45 DAY),
    'buyer'
  ),
  (
    'inactive1',
    'inactive1@example.com',
    'test_hash_123',
    'Ivy',
    'Inactive',
    350000.00,
    690,
    5200.00,
    2600.00,
    12000.00,
    (UTC_TIMESTAMP() - INTERVAL 90 DAY),
    (UTC_TIMESTAMP() - INTERVAL 120 DAY),
    'buyer'
  ),
  (
    'inactive2',
    'inactive2@example.com',
    'test_hash_123',
    'Noah',
    'Inactive',
    610000.00,
    740,
    9100.00,
    4100.00,
    80000.00,
    (UTC_TIMESTAMP() - INTERVAL 35 DAY),
    (UTC_TIMESTAMP() - INTERVAL 200 DAY),
    'buyer'
  ),
  (
    'inactive3',
    'inactive3@example.com',
    'test_hash_123',
    'Mia',
    'Inactive',
    475000.00,
    705,
    7200.00,
    3300.00,
    42000.00,
    NULL,
    (UTC_TIMESTAMP() - INTERVAL 160 DAY),
    'buyer'
  ),
  (
    'inactive4',
    'inactive4@example.com',
    'test_hash_123',
    'Owen',
    'Inactive',
    410000.00,
    660,
    5900.00,
    2700.00,
    15000.00,
    (UTC_TIMESTAMP() - INTERVAL 60 DAY),
    (UTC_TIMESTAMP() - INTERVAL 90 DAY),
    'buyer'
  ),
  (
    'inactive5',
    'inactive5@example.com',
    'test_hash_123',
    'Ava',
    'Inactive',
    520000.00,
    710,
    7800.00,
    3600.00,
    30000.00,
    (UTC_TIMESTAMP() - INTERVAL 15 DAY),
    (UTC_TIMESTAMP() - INTERVAL 30 DAY),
    'buyer'
  ),
  (
    'active1',
    'active1@example.com',
    'test_hash_123',
    'Liam',
    'Active',
    499000.00,
    735,
    8400.00,
    3200.00,
    54000.00,
    (UTC_TIMESTAMP() - INTERVAL 1 DAY),
    (UTC_TIMESTAMP() - INTERVAL 20 DAY),
    'buyer'
  ),
  (
    'active2',
    'active2@example.com',
    'test_hash_123',
    'Emma',
    'Active',
    385000.00,
    715,
    6100.00,
    2400.00,
    22000.00,
    (UTC_TIMESTAMP() - INTERVAL 3 DAY),
    (UTC_TIMESTAMP() - INTERVAL 11 DAY),
    'buyer'
  ),
  (
    'active3',
    'active3@example.com',
    'test_hash_123',
    'Lucas',
    'Active',
    715000.00,
    765,
    12500.00,
    5200.00,
    110000.00,
    (UTC_TIMESTAMP() - INTERVAL 6 DAY),
    (UTC_TIMESTAMP() - INTERVAL 70 DAY),
    'buyer'
  ),
  (
    'active4',
    'active4@example.com',
    'test_hash_123',
    'Sophia',
    'Active',
    458000.00,
    700,
    6900.00,
    2800.00,
    37000.00,
    (UTC_TIMESTAMP() - INTERVAL 10 DAY),
    (UTC_TIMESTAMP() - INTERVAL 10 DAY),
    'buyer'
  ),
  (
    'active5',
    'active5@example.com',
    'test_hash_123',
    'Ethan',
    'Active',
    565000.00,
    725,
    8800.00,
    3900.00,
    62000.00,
    (UTC_TIMESTAMP() - INTERVAL 13 DAY),
    (UTC_TIMESTAMP() - INTERVAL 13 DAY),
    'buyer'
  )
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  desired_home_price = VALUES(desired_home_price),
  credit_score = VALUES(credit_score),
  monthly_income = VALUES(monthly_income),
  monthly_expenses = VALUES(monthly_expenses),
  total_savings = VALUES(total_savings),
  last_logged_in_at = VALUES(last_logged_in_at),
  role = VALUES(role);

INSERT INTO user_progress (user_id, stage, completed, completed_at, notes)
VALUES
  (1, 'Pre-Approval', TRUE, NOW(), 'Pre-approval complete'),
  (1, 'House Hunting', TRUE, NOW(), 'Viewed several homes'),
  (1, 'Offer Made', FALSE, NULL, NULL),
  (1, 'Under Contract', FALSE, NULL, NULL),
  (1, 'Inspection', FALSE, NULL, NULL),
  (1, 'Appraisal', FALSE, NULL, NULL),
  (1, 'Final Loan Approval', FALSE, NULL, NULL),
  (1, 'Closing', FALSE, NULL, NULL)
ON DUPLICATE KEY UPDATE
  completed = VALUES(completed),
  completed_at = VALUES(completed_at),
  notes = VALUES(notes);

INSERT INTO properties (user_id, address, city, state, zip, sqft, bedrooms)
SELECT 1, '123 Main St', 'Provo', 'UT', '84604', 1800, 3
WHERE NOT EXISTS (
  SELECT 1
  FROM properties
  WHERE user_id = 1 AND address = '123 Main St'
);