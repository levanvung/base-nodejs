/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('audit_logs', function (table) {
        table.increments('id').primary();
        table.integer('user_id').nullable();
        table.string('action').notNullable();
        table.string('ip').nullable();
        table.string('user_agent').nullable();
        table.text('details').nullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

        table.index(['user_id']);
        table.index(['action']);

        table
            .foreign('user_id')
            .references('id')
            .inTable('users')
            .onDelete('SET NULL');
    });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('audit_logs');
};
