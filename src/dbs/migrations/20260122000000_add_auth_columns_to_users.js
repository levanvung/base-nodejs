/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('users', function (table) {
        table.string('two_factor_secret', 255).nullable();
        table.boolean('is_two_factor_enabled').notNullable().defaultTo(false);
        table.integer('token_version').notNullable().defaultTo(0);
    });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('users', function (table) {
        table.dropColumn('two_factor_secret');
        table.dropColumn('is_two_factor_enabled');
        table.dropColumn('token_version');
    });
};
