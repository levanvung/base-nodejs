/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
      // Thêm cột role
      table.string('role', 10).defaultTo('user').notNullable(); 
      // ('user', 'admin')

      // Thêm cột auth_type
      table.string('auth_type', 10).defaultTo('local').notNullable(); 
      // ('local', 'google', 'facebook')

      // Thêm cột google_id (Có thể null nếu họ đăng ký bằng email thường)
      table.string('auth_google_id', 100).nullable();

      // Thêm cột check verify (cho luồng OTP)
      table.boolean('is_verified').defaultTo(false);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
      table.dropColumn('role');
      table.dropColumn('auth_type');
      table.dropColumn('auth_google_id');
      table.dropColumn('is_verified');
  });
};