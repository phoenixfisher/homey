CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  desired_home_price DECIMAL(12,2) NULL,
  credit_score SMALLINT UNSIGNED NULL,
  monthly_income DECIMAL(12,2) NULL,
  monthly_expenses DECIMAL(12,2) NULL,
  total_savings DECIMAL(12,2) NULL,
  target_zip_code VARCHAR(10) NULL,
  industry_of_work ENUM(
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Manufacturing',
    'Retail',
    'Construction',
    'Real Estate',
    'Marketing & Advertising',
    'Legal Services',
    'Hospitality',
    'Transportation',
    'Arts & Entertainment',
    'Government',
    'Other'
  ) NULL,
  role ENUM('buyer', 'agent', 'admin') DEFAULT 'buyer',
  last_logged_in_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_progress (
  prog_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  stage ENUM(
    'Pre-Approval',
    'House Hunting',
    'Offer Made',
    'Under Contract',
    'Inspection',
    'Appraisal',
    'Final Loan Approval',
    'Closing'
  ) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_stage (user_id, stage),
  CONSTRAINT fk_user_progress_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS properties (
  prop_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  state CHAR(2),
  zip VARCHAR(10),
  sqft INT,
  bedrooms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_properties_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
);