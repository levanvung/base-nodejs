/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('key_tokens', function (table) {
        table.increments('id').primary();
        table.integer('userId').notNullable().unique();
        table.string('refreshToken').notNullable();
        table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

        table
            .foreign('userId')
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
    });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('key_tokens');
};
