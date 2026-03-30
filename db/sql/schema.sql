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

-- Stores pre-approval workflow data per user (loan application fields,
-- document checklist, and qualification snapshots).
CREATE TABLE IF NOT EXISTS preapproval_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,

  -- Loan Application (non-sensitive fields only)
  loan_phone VARCHAR(30) NULL,
  loan_dependents VARCHAR(10) NULL,
  loan_marital_status VARCHAR(50) NULL,
  loan_current_address VARCHAR(255) NULL,
  loan_current_address_years VARCHAR(10) NULL,
  loan_previous_address VARCHAR(255) NULL,
  loan_rent_or_own VARCHAR(50) NULL,
  loan_monthly_housing_payment DECIMAL(12,2) NULL,
  loan_landlord_contact VARCHAR(255) NULL,
  loan_employer_name VARCHAR(255) NULL,
  loan_employer_address VARCHAR(255) NULL,
  loan_job_title VARCHAR(255) NULL,
  loan_employment_type VARCHAR(50) NULL,
  loan_start_date VARCHAR(30) NULL,
  loan_previous_employer VARCHAR(255) NULL,
  loan_employment_gaps TEXT NULL,
  loan_base_salary DECIMAL(12,2) NULL,
  loan_bonuses DECIMAL(12,2) NULL,
  loan_self_employ_income DECIMAL(12,2) NULL,
  loan_rental_income DECIMAL(12,2) NULL,
  loan_other_income DECIMAL(12,2) NULL,
  loan_other_income_source VARCHAR(255) NULL,
  loan_checking_balance DECIMAL(12,2) NULL,
  loan_savings_balance DECIMAL(12,2) NULL,
  loan_retirement_balance DECIMAL(12,2) NULL,
  loan_investment_balance DECIMAL(12,2) NULL,
  loan_gift_funds DECIMAL(12,2) NULL,
  loan_real_estate_value DECIMAL(12,2) NULL,
  loan_other_assets TEXT NULL,
  loan_credit_card_payment DECIMAL(12,2) NULL,
  loan_student_loan_payment DECIMAL(12,2) NULL,
  loan_auto_loan_payment DECIMAL(12,2) NULL,
  loan_child_support DECIMAL(12,2) NULL,
  loan_other_debt DECIMAL(12,2) NULL,
  loan_decl_outstanding_judgments VARCHAR(10) NULL,
  loan_decl_bankruptcy VARCHAR(10) NULL,
  loan_decl_foreclosure VARCHAR(10) NULL,
  loan_decl_lawsuit VARCHAR(10) NULL,
  loan_decl_cosigner VARCHAR(10) NULL,
  loan_decl_citizenship VARCHAR(10) NULL,
  loan_decl_primary_residence VARCHAR(10) NULL,
  loan_saved_at TIMESTAMP NULL,

  -- Document Checklist (one boolean per document slot)
  doc_paystub_1 BOOLEAN DEFAULT FALSE,
  doc_paystub_2 BOOLEAN DEFAULT FALSE,
  doc_paystub_eoy_1 BOOLEAN DEFAULT FALSE,
  doc_paystub_eoy_2 BOOLEAN DEFAULT FALSE,
  doc_tax_1 BOOLEAN DEFAULT FALSE,
  doc_tax_2 BOOLEAN DEFAULT FALSE,
  doc_w2_year1 BOOLEAN DEFAULT FALSE,
  doc_w2_year2 BOOLEAN DEFAULT FALSE,
  doc_gov_id BOOLEAN DEFAULT FALSE,
  doc_bank_1 BOOLEAN DEFAULT FALSE,
  doc_bank_2 BOOLEAN DEFAULT FALSE,
  doc_bank_3 BOOLEAN DEFAULT FALSE,
  doc_bank_4 BOOLEAN DEFAULT FALSE,
  doc_saved_at TIMESTAMP NULL,

  -- Qualification Snapshot
  snap_dti DECIMAL(6,2) NULL,
  snap_credit_score SMALLINT UNSIGNED NULL,
  snap_monthly_income DECIMAL(12,2) NULL,
  snap_monthly_expenses DECIMAL(12,2) NULL,
  snap_savings DECIMAL(12,2) NULL,
  snap_down_payment_pct DECIMAL(6,2) NULL,
  snap_saved_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_preapproval (user_id),
  CONSTRAINT fk_preapproval_user
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