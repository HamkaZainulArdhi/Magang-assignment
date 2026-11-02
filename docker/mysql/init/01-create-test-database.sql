CREATE DATABASE IF NOT EXISTS inventory_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON inventory_test.* TO 'inventory'@'%';
FLUSH PRIVILEGES;
