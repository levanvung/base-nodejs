/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
      // Thêm cột is_active (như bạn yêu cầu)
      // Lưu ý: users đã có cột 'status', bạn cân nhắc xem có cần thiết thêm cột này không nhé.
      table.boolean('is_active').defaultTo(true);

      // Thêm cột avatar (URL ảnh)
      table.string('avatar').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.alterTable('users', function(table) {
        table.dropColumn('is_active');
        table.dropColumn('avatar');
    });
};
