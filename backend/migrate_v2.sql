-- Migration v2: milestones, learning progress, money settings
-- Run this against homey_dev (local) and your Railway MySQL database

-- Milestone completion per user
CREATE TABLE IF NOT EXISTS user_milestones (
    user_id     INT NOT NULL,
    milestone_id INT NOT NULL,
    completed   TINYINT(1) NOT NULL DEFAULT 0,
    completed_at DATETIME NULL,
    PRIMARY KEY (user_id, milestone_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Learning module completion per user
CREATE TABLE IF NOT EXISTS user_learning_progress (
    user_id     INT NOT NULL,
    module_id   VARCHAR(100) NOT NULL,
    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, module_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Money management settings stored on the users row
ALTER TABLE users
    ADD COLUMN money_savings_goal   DECIMAL(12,2) NULL,
    ADD COLUMN money_housing_budget DECIMAL(12,2) NULL;
