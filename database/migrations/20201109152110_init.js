exports.up = function (knex) {
    return knex.schema
        .createTable('users', tbl => {
            tbl.increments('user_id')
            tbl.string('user_username', 128).notNullable().unique()
            tbl.string('user_password', 256).notNullable()
        })
}

exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('users')
}
