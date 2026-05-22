/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('otp', function (table) {
        table.increments('id').primary();
        table.string('email').notNullable();
        table.string('otp_code').notNullable();
        table.string('otp_type').notNullable();
        table.timestamp('expires_at').notNullable();
        table.boolean('is_used').notNullable().defaultTo(false);
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

        table.index(['email', 'otp_type']);
    });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('otp');
};
