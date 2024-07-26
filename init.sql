-- Update root user to use mysql_native_password
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;

-- Create new db user
CREATE USER 'aspectapi'@'localhost' IDENTIFIED BY 'mypassword';

-- Grant user full privilege
GRANT ALL PRIVILEGES ON *.* TO 'aspectapi'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;