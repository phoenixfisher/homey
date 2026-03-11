INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ('buyer1@example.com', 'test_hash_123', 'Jane', 'Doe', 'buyer')
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
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