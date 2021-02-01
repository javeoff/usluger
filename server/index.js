const express = require('express')
const app = express()
const path = require('path');
const fetch = require('node-fetch')
const crypto = require('crypto')
const cors = require('cors')
const fileupload = require("express-fileupload");
var json2xlsx = require('json2xlsx');

const { translit } = require('gost-transliteration');
const fs = require('fs');

app.use(cors())
app.use(fileupload())

const AuthUsers = []

var knex = require('knex')({
    client: 'mysql',
    connection: {
        host: 'localhost',
        user: 'usluger_user',
        password: 'iA9wT7yR3icR6g',
        database: 'usluger'
    }
});

function createUsers() {
    return knex.schema.createTable('users', function(t) {
        t.increments('user_id').primary();
        t.string('user_phone', 24);
        t.string('user_name', 24);
        t.string('user_image', 48);
        t.integer('admin', 1);
    })
}

function createSessions() {
    return knex.schema.createTable('auth_sessions', function(t) {
        t.integer('user_id', 24);
        t.string('auth_token', 48);
    })
}

function createCities() {
    return knex.schema.createTable('cities', function(t) {
        t.increments('city_id').primary();
        t.integer('city_type', 1); // 1 - Город, 0 - Область, 3 - Регион
        t.integer('city_parent', 3)
        t.string('city_name', 48);
        t.string('city_query', 48);
    })
}

function createCategories() {
    return knex.schema.createTable('categories', function(t) {
        t.increments('category_id').primary();
        t.string('category_name', 48);
        t.integer('parent_id', 3);
    })
}

function createPosts() {
    return knex.schema.createTable('posts', function(t) {
        t.increments('post_id').primary();
        t.integer('city_id', 3);
        t.integer('status', 1).defaultTo(0);
        t.integer('category_id', 3);
        t.integer('author_id', 12);
        t.integer('comment_count', 6);
        t.integer('timestamp', 48);
        t.integer('auto_update', 1); // 1 - true, 0 - false
        t.integer('update_id', 12);
        t.text('post_table');
        t.string('post_name', 64);
        t.text('post_description');
        t.string('image1', 64).defaultTo('');
        t.string('image2', 64);
        t.string('image3', 64);
        t.string('item_table1', 64);
        t.string('item_table2', 64);
        t.string('item_table3', 64);
        t.string('item_table4', 64);
    })
}

function createComments() {
    return knex.schema.createTable('comments', function(t) {
        t.increments('comment_id').primary();
        t.integer('author_id', 12);
        t.integer('post_id', 12);
        t.integer('timestamp', 24);
        t.text('comment_content');
    })
}

async function start() {
    await createUsers()
    await createSessions()
    await createCities()
    await createCategories()
    await createPosts()
    await createComments()
}

// start()


function AuthUser(res, auth_token, user_id) {
    return new Promise(async (resolve, reject) => {
        const AuthData = (await knex('auth_sessions').where({auth_token, user_id}).select('*'))[0]
        if (!AuthData) resolve(false)
        resolve(true)
    })
}

function AdminUser(res, auth_token, user_id) {
    return new Promise(async (resolve, reject) => {
        const AuthData = (await knex('auth_sessions').where({auth_token, user_id}).select('*'))[0]
        const AdminData = Number((await knex('users').where({user_id}).select('*'))[0]["admin"]) === 1 ? true : false
        if (!AuthData || !AdminData) resolve(false)
        resolve(true)
    })
}

function generateToken() {
    const token = Math.random().toString(36).slice(-5)
    return [crypto.createHash('md5').update(token).digest('hex'), token]
}

async function EncodeToken(token) {
    return crypto.createHash('md5').update(token).digest('hex')
}

function generateUpdateid() {
    return new Promise(async (resolve, reject) => {
        const users_count = (await knex('posts').select("*")).length
        resolve(users_count + 1)
    })
}

/* Login
*  Authorize
*/

app.get('/login/call', async (req, res) => {
    const {phone} = req.query
    let code = Math.floor(Math.random() * (9999 - 1000)) + 1000
    console.log(code);

    var params = {
        "public_key": "892b4b032f019944a283a04bda2fd90f",
        "phone": '+'+phone,
        "campaign_id": "1025677229",
        "text": "Ваш код авторизации на usluger.com: "+code
    }
    //https://zvonok.com/manager/cabapi_external/api/v1/phones/call/?campaign_id=1025677229&phone=%2B79105769283&public_key=892b4b032f019944a283a04bda2fd90f&text=B&speaker=Maxim
    const response = await fetch(`https://zvonok.com/manager/cabapi_external/api/v1/phones/call/?${new URLSearchParams(params).toString()}`).catch(e => console.error(e))

    console.log(await response.json())

    let loginId = AuthUsers.length + 1
    AuthUsers[loginId] = code
    res.send({response, status: 1, loginId})
})

app.get('/login/confirm', async (req, res) => {
    const {loginId, code, phone} = req.query

    if (AuthUsers[loginId] === code) {
        const user_data = (await knex('users').where("user_phone", phone).select("*"))[0]
        if (!user_data) {
            //create and select
            //await knex('users').insert({user_phone: phone, user_name: name, user_image: '../images/user-profile.png'})
            res.send({response: "Member are registrating", register: 1, logged: 0})
            return
        }   

        const auth = generateToken()
        const auth_token = auth[1] // Descrypted token
        const secret_token = auth[0] // Encrypted token

        let user_id = user_data["user_id"]
        await knex('auth_sessions').insert({user_id, auth_token: secret_token})

        res.send({response: {auth_token, user_id}, logged: 1})
    }
    else res.send({error:"verification codes do not match", logged: 0, register: 0})
})

app.get('/login/register', async (req, res) => {
    const {loginId, code, phone, name} = req.query

    if (AuthUsers[loginId] === code) {
        console.log(phone);
        var user_data = (await knex('users').where({user_phone: phone}).select("*"))[0]
        if (!user_data) {
            await knex('users').insert({user_phone: phone, user_name: name, user_image: 'image/user-profile.png'})
            user_data = (await knex('users').where({user_phone: phone}).select("*"))[0]
        }   

        const auth = generateToken()
        const auth_token = auth[1] // Descrypted token
        const secret_token = auth[0] // Encrypted token

        let user_id = user_data["user_id"]
        await knex('auth_sessions').insert({user_id, auth_token: secret_token})

        res.send({response: {auth_token, user_id}, logged: 1})
    }
    else res.send({error:"User name do not match", logged: 0, register: 0})
})

/* Users Table
*
*/

app.get('/api/users', async (req, res) => {
    const users = await knex('users').select("*")
    res.send({response: {users}, status: 1})
})

app.get('/api/users/get', async (req, res) => {
    const {auth_token, user_id} = req.query
    console.log(await EncodeToken(auth_token), user_id);
    const Auth = await AuthUser(res, await EncodeToken(auth_token), user_id)
    if (Auth) {
        const user_data = (await knex('users').where({user_id}).select("*"))[0]
        if (!user_data) return res.send({error: "User is not found", status: 0})
        res.send({response: {user_data}, status: 1})
    }
    else {
        res.send({error: "User is not found", status: 0})
    }
})

app.get('/api/users/info', async (req, res) => {
    const {user_id} = req.query
    const {user_name, user_image} = (await knex('users').where({user_id}).select("*"))[0]
    if (!user_data) return res.send({error: "User is not found", status: 0})
    res.send({response: {user_data: {user_name, user_image}}, status: 1})
})

app.get('/api/users/add', async (req, res) => { 
    console.log(req.headers);
    // const {user_phone, user_name, user_image} = req.headers
    // await knex('users').insert({user_phone, user_name, user_image})
    // .catch(e => res.send({error: "Mysql adding user is rejected", status: 0}))

    res.send({response: "User has been added", status: 1})
})

app.get('/api/users/remove', async (req, res) => { 
    const {user_id} = req.headers
    await knex('users').where({user_id}).del()
    .catch(e => res.send({error: "User was not found", status: 0}))

    res.send({response: "User has been deleted", status: 1})
})

app.post('/api/users/edit', async (req, res) => { 
    const {auth_token, user_id, user_email} = req.headers //
    const user_image = req.files ? req.files.file : null
    console.log(user_image);

    const Auth = await AuthUser(res, await EncodeToken(auth_token), user_id)
    if (Auth) {
        if (user_image) {
            fs.writeFileSync(`avatars/${user_id}.${user_image.name.split('.')[1]}`, user_image.data)
            var image_url = `image/${user_id}.${user_image.name.split('.')[1]}`
            var data =  await knex('users').where({user_id: Number(user_id)}).update({user_email, user_image:image_url}) //user_phone: user_phone.split('+')[1], 
        }
        else {
            var data = await knex('users').where({user_id: Number(user_id)}).update({user_email}) //user_phone: user_phone.split('+')[1], 
        }

        if (data) res.send({response: {text: "User has been edited", url: image_url && image_url}, status: 1})
        else res.send({error: "User was not found", status: 0})
    }
    else {
        res.send({error: "User is not found", status: 0})
    }
})

/* Sessions Table
*
*/

app.get('/api/sessions/auth', async (req, res) => { 
    const {auth_token} = req.query
    const Auth = await AuthUser(res, await EncodeToken(auth_token))
    if (!Auth) return res.send({response: "Auth hash is empty", logged: 0})
    let user_id = Auth["user_id"] 

    res.send({response: {user_id}, logged: 1})
})

app.get('/api/sessions/add', async (req, res) => { 
    const {user_id} = req.headers

    const auth = generateToken()
    const auth_token = auth[1] // Descrypted token
    const secret_token = auth[0] // Encrypted token

    await knex('auth_sessions').insert({user_id, auth_token: secret_token})
    res.send({response: {auth_token}, logged: 1})
})

app.get('/api/sessions/remove', async (req, res) => { 
    const {auth_token} = req.headers
    await knex('auth_sessions').where({auth_token}).del()
})

/* Cities Table
* 0 - region, 1 - sub_region, 2 - city
*/

var cities = [
    "Москва","Санкт-Петербург","Краснодар","Казань","Ростов-на-Дону","Рязань","Самара","Нижний Новгород","Уфа","Новосибирск","Челябинск","Пермь","Воронеж","Екатеринбург","Омск","Волгоград","Сочи","Красноярск","Оренбург","Иркутск","Саратов","Тюмень","Барнаул","Калининград","Ставрополь","Астрахань","Ульяновск","Ярославль","Набережные Челны","Белгород","Тольятти","Ижевск","Киров","Тверь","Хабаровск","Тула","Чебоксары"
]

const toQuery = name => (translit(name))

function addCities() {
    cities.forEach(async city_name => {
        let city_type = 2
        let city_parent = 0
        let city_query = translit(city_name).split(' ').join('-').split("'").join('')
    
        await knex('cities').insert({city_type, city_parent, city_name, city_query})
    })
}

async function addRegions() {
    var regions = require('./regions.json')["regions"]
    for (name in regions) {
        let query = translit(name).split(' ').join('-')
        const region_id = await knex('cities').insert({city_type: 0, city_parent: 0, city_name: name, city_query: String(query).split("'").join('')})
        regions[name]["data"].forEach(async sub_region => {
            let query = translit(sub_region).split(' ').join('-')
            await knex('cities').insert({city_type: 1, city_parent: region_id, city_name: sub_region, city_query: String(query).toString().split("'").join('')})
        })
    }
    console.log('готово');
}

// addCities()
// addRegions()


app.get('/api/cities', async (req, res) => { 
    let third = cities.length/3
    const citiesArr = cities.map(city => [city, translit(city).split(' ').join('-').split("'").join('')])

    var cities1 = []
    var cities2 = []
    var cities3 = []

    citiesArr.forEach((city, i) => {
    if (i <= Math.round(third)) cities1.push([city[0], `/cities/${city[1]}`])
    else if (i < Math.round(third*2)) cities2.push([city[0], `/cities/${city[1]}`])
    else cities3.push([city[0], `/cities/${city[1]}`])
    })
    res.send({response: {cities1, cities2, cities3}, status: 1})
})

app.get('/api/cities/get', async (req, res) => { 
    const {city_id} = req.query
    const city = (await knex('cities').where({city_id}).select('*'))[0]
    if (!city) return res.send({error: "City is not found", status: 0})
    res.send({response: {city}, status: 1})
})

app.get('/api/cities/parent', async (req, res) => { 
    const {city_parent} = req.query
    const cities = await knex('cities').where({city_parent}).select('*')
    if (!cities) return res.send({error: "Cities were not found", status: 0})
    res.send({response: {cities}, status: 1})
})

app.get('/api/cities/find', async (req, res) => { 
    const {city_query} = req.query
    const city = (await knex('cities').where({city_query}).select('*'))[0]
    if (!city) return res.send({error: "City is not found", status: 0})
    res.send({response: {city}, status: 1})
})

app.get('/api/regions', async (req, res) => { 
    var regions = (await knex('cities').where({city_type: 0}).select('*')).map(city => [city["city_name"], city["city_query"], city["city_id"]])
    let third = Object.keys(regions).length/3
    var regions1 = []
    var regions2 = []
    var regions3 = []

    regions.forEach((city, i) => {
    if (i <= Math.round(third)) regions1.push([city[0], `/cities/${city[1]}`, city[2]])
    else if (i < Math.round(third*2)) regions2.push([city[0], `/cities/${city[1]}`, city[2]])
    else regions3.push([city[0], `/cities/${city[1]}`, city[2]])
    })

    res.send({response: {regions1, regions2, regions3}, status: 1})
})

/* Categories Table
*
*/

async function addCategories() {
    var categories = require('./categories.json')
    for (let a = 0; a < Object.keys(categories).length; a++) {
        const category_name1 = Object.keys(categories)[a]
        const category1 =  categories[category_name1];

        await knex('categories').insert({category_name: category_name1, parent_id: 0})
        let parent_id1 = Number((await knex('categories').where({category_name: category_name1}).select('category_id'))[0]['category_id'])

        for (let b = 0; b < Object.keys(category1).length; b++) {
            const category_name2 = Object.keys(category1)[b]
            const category2 =  category1[category_name2];
    
            await knex('categories').insert({category_name: category_name2, parent_id: parent_id1})
            let parent_id2 = Number((await knex('categories').where({category_name: category_name2}).select('category_id'))[0]['category_id'])
            
            for (let c = 0; c < category2.length; c++) {
                const category_name3 = category2[c];
                await knex('categories').insert({category_name: category_name3, parent_id: parent_id2})
            }
        }
    }
}

//addCategories()

app.get('/api/categories', async (req, res) => {
    var cat_data = [[]]
    const category_data = await knex('categories').where({parent_id: 0}).select("*")
    category_data.forEach((category, i) => {
        i++
        cat_data[cat_data.length-1].push({id: category.category_id, name: category.category_name, count: category.category_count})
        if (i % 8 == 0) {
            cat_data.push([])
        }
    }) 

    console.log(cat_data);

    res.send({response: {categories: cat_data}, status: 1})
})

app.get('/api/categories/find', async (req, res) => {
    const {parent_id} = req.query
    var cat_data = [[]]
    const category_data = await knex('categories').where({parent_id: Number(parent_id)}).select("*")
    category_data.forEach((category, i) => {
        i++
        cat_data[cat_data.length-1].push({id: category.category_id, name: category.category_name, count: category.category_count})
        if (i % 8 == 0) {
            cat_data.push([])
        }
    }) 

    console.log(cat_data);

    res.send({response: {categories: cat_data}, status: 1})
})

app.get('/api/categories/get', async (req, res) => { 
    const {category_id} = req.query
    const category_data = (await knex('categories').where({category_id: Number(category_id)}).select("*"))[0]
    if (!category_data) return res.send({error: "Category was not found", status: 0})
    res.send({response: {category_data}, status: 1})
})

/* Posts Table
*
*/

app.get('/api/posts', async (req, res) => { 
    const {city_id, offset} = req.query
    var limit = 12
    const posts = await knex('posts').offset(Number(offset)).limit(limit).where({city_id, status: 1}).orderBy('timestamp', 'desc').select("*")
    console.log(posts.length);
    for (post of posts) {
        post["author_name"] = (await knex('users').where({user_id: post["author_id"]}).select("*"))[0]["user_name"]
        post["city_name"] = (await knex('cities').where({city_id: post["city_id"]}).select("*"))[0]["city_name"]
    }

    if (posts.length <= 0) return res.send({error: "Posts were not found", status: 0})
    res.send({response: {posts}, status: 1})
})

app.get('/api/posts/get', async (req, res) => { 
    const {post_id} = req.query
    console.log(req.query);
    if (req.query.user_id) {
        var post_data = (await knex('posts').where({post_id: Number(post_id), author_id: Number(req.query.user_id)}).select("*"))[0]
    }
    else {
        var post_data = (await knex('posts').where({post_id: Number(post_id), status: 1}).select("*"))[0]
    }
    if (!post_data) return res.send({error: "Post was not found", status: 0})

    let user = (await knex('users').where({user_id: post_data["author_id"]}).select("*"))[0]
    let city = (await knex('cities').where({city_id: post_data["city_id"]}).select("*"))[0]
    let parent = (await knex('cities').where({city_parent: city["city_parent"]}).select("*"))[0]
    post_data["author_name"] = user["user_name"]
    post_data["city_name"] = city["city_name"]
    post_data["city_link"] = `/cities/${city["city_query"]}`
    post_data["city_parent"] = parent["city_name"]
    post_data["parent_link"] = `/cities/${parent["city_query"]}`
    post_data["pcategory_id"] = (await knex('categories').where({category_id: post_data["category_id"]}).select("*"))[0]["parent_id"]
    post_data["pcity_id"] = (await knex('cities').where({city_id: post_data["city_id"]}).select("*"))[0]["city_parent"]
    post_data["phone"] = user["user_phone"]
    post_data["user_image"] = user["user_image"]

    console.log(post_data);

    res.send({response: {post_data}, status: 1})
})

app.get('/api/posts/get_by_category', async (req, res) => { 
    const {category_id, city_id} = req.query
    const posts = await knex('posts').where({category_id: Number(category_id), city_id: Number(city_id), status: 1}).select("*")
    console.log(posts.length);
    if (posts.length <= 0) return res.send({error: "Posts were not found", status: 0})
    res.send({response: {posts}, status: 1})
})

app.get('/api/posts/get_by_user', async (req, res) => { 
    const {author_id} = req.query
    var posts = await knex('posts').where({author_id: Number(author_id)}).select("*")
    if (posts.length <= 0) return res.send({error: "Posts were not found", status: 0})
    res.send({response: {posts}, status: 1})
})

app.get('/api/posts/get_phone', async (req, res) => { 
    const {post_id} = req.query
    const post_data = (await knex('posts').where({post_id: Number(post_id)}).select("*"))[0]
    const user_data = (await knex('users').where({user_id: post_data["author_id"]}).select("*"))[0]
    const phone = user_data["user_phone"]
    res.send({response: {phone}, status: 1})
})

app.post('/api/child_posts', async (req, res) => { 
    let {cities} = req.headers
    console.log(cities);
    let queryFilter = 'WHERE '+cities.split(',').map(c => '`city_id` = ' + c + ' AND `status` = 1').join(' OR ')
    console.log(knex.raw('SELECT * FROM `posts` '+queryFilter).toString());
    var posts = (await knex.raw('SELECT * FROM `posts` '+queryFilter))[0]
    for (post of posts) {
        post["author_name"] = (await knex('users').where({user_id: post["author_id"]}).select("*"))[0]["user_name"]
        post["city_name"] = (await knex('cities').where({city_id: post["city_id"]}).select("*"))[0]["city_name"]
    }
    
    if (posts.length <= 0) return res.send({error: "Posts were not found", status: 0})
    res.send({response: {posts}, status: 1})
})

app.post('/api/posts/get_by_parent', async (req, res) => { 
    let {categories, city_id} = req.headers
    categories = categories.split(',').map(e => Number(e))
    console.log(categories);
    let queryFilter = 'WHERE '+categories.map(e => '(`category_id` = '+e+' AND `city_id` = '+city_id+' AND `status` = 1)').join(' OR ')
    const posts = (await knex.raw('SELECT * FROM `posts` '+queryFilter))[0]
    console.log(posts);
    if (posts.length <= 0) return res.send({error: "Posts were not found", status: 0})
    res.send({response: {posts}, status: 1})
})

app.post('/api/posts/add', async (req, res) => { 
    let {auth_token, city_id, category_id, author_id, item_table1, item_table2, item_table3, item_table4, post_name, post_description} = req.body // NO AUTHOR_ID USER_ID

    const Auth = await AuthUser(res, await EncodeToken(auth_token), author_id)
    if (Auth) {
        category_id = Number(category_id)
        city_id = Number(city_id)
        author_id = Number(author_id)

        var item_image1 = req.files ? req.files.item_image1 : null
        var item_image2 = req.files ? req.files.item_image2 : null
        var item_image3 = req.files ? req.files.item_image3 : null

        const auto_update = 0
        const comment_count = 0
        const update_id = await generateUpdateid()
        console.log(Number(Date.now()));
        const post = await knex('posts').insert({timestamp: Number(Date.now()), auto_update, comment_count, update_id, city_id, category_id, author_id, item_table1, item_table2, item_table3, item_table4, post_name, post_description}, ["post_id"])
        let post_id = post[0]
        let images = {}

        if (item_image1) {
            fs.writeFileSync(`posts/${post_id}-1.${item_image1.name.split('.')[1]}`, item_image1.data) 
            images["image1"] = `posts/${post_id}-1.${item_image1.name.split('.')[1]}`     
        }
        if (item_image2) {
            fs.writeFileSync(`posts/${post_id}-2.${item_image2.name.split('.')[1]}`, item_image2.data)
            images["image2"] = `posts/${post_id}-2.${item_image2.name.split('.')[1]}`
        }
        if (item_image3) {
            fs.writeFileSync(`posts/${post_id}-3.${item_image3.name.split('.')[1]}`, item_image3.data)
            images["image3"] = `posts/${post_id}-3.${item_image3.name.split('.')[1]}` 
        }

        if (images["image1"] || images["image2"] || images["image3"]) await knex('posts').where({post_id}).update(images)

        res.send({response: "Post has been added", status: 1})
    }
    else {
        res.send({response: "User is not logged", status: 0})
    }
})

app.post('/api/posts/edit', async (req, res) => { 
    var {auth_token, post_id, city_id, category_id, author_id, item_table1, item_table2, item_table3, item_table4, post_name, post_description} = req.body // NO AUTHOR_ID USER_ID
    console.log(post_id);

    const Auth = await AuthUser(res, await EncodeToken(auth_token), author_id)
    if (Auth) {
        category_id = Number(category_id)
        city_id = Number(city_id)
        author_id = Number(author_id)

        var item_image1 = req.files ? req.files.item_image1 : null
        var item_image2 = req.files ? req.files.item_image2 : null
        var item_image3 = req.files ? req.files.item_image3 : null

        const auto_update = 0
        const comment_count = 0
        const update_id = await generateUpdateid()
        const post = (await knex('posts').where({post_id: Number(post_id)}).update({status: 0, auto_update, comment_count, update_id, city_id, category_id, author_id, item_table1, item_table2, item_table3, item_table4, post_name, post_description}, ["post_id"]))[0]
        let images = {}

        if (item_image1) {
            fs.writeFileSync(`posts/${post_id}-1.${item_image1.name.split('.')[1]}`, item_image1.data) 
            images["image1"] = `posts/${post_id}-1.${item_image1.name.split('.')[1]}`     
        }
        if (item_image2) {
            fs.writeFileSync(`posts/${post_id}-2.${item_image2.name.split('.')[1]}`, item_image2.data)
            images["image2"] = `posts/${post_id}-2.${item_image2.name.split('.')[1]}`
        }
        if (item_image3) {
            fs.writeFileSync(`posts/${post_id}-3.${item_image3.name.split('.')[1]}`, item_image3.data)
            images["image3"] = `posts/${post_id}-3.${item_image3.name.split('.')[1]}` 
        }

        if (images["image1"] || images["image2"] || images["image3"]) await knex('posts').where({post_id}).update(images)

        res.send({response: "Post has been edited", status: 1})
    }
    else {
        res.send({response: "User is not logged", status: 0})
    }
})

app.get('/api/posts/update', async (req, res) => { 
    const {post_id, auth_token, author_id} = req.query // NO AUTHOR_ID USER_ID
    //const update_id = await generateUpdateid()

    console.log(post_id);

    const Auth = await AuthUser(res, await EncodeToken(auth_token), author_id)
    if (Auth) {
        const post = (await knex('posts').where({post_id}).select("*"))[0]
        if (post && Number(post["author_id"]) === Number(author_id)) {
            var timestamp = Number(Date.now())
            if (timestamp - Number(post["timestamp"]) < 360000) {
                res.send({error: "time", status: 0})
            }
            else {
                await knex('posts').where({post_id}).update({timestamp: String(timestamp)})
                res.send({error: "Post has been updated", status: 1})                
            }

        }
        else {
            res.send({error: "Post is not yours", status: 0})
        }
    }
    else {
        res.send({error: "User is not logged", status: 0})
    }
})

app.get('/api/posts/remove', async (req, res) => { 
    const {auth_token, post_id, user_id} = req.query

    const Auth = await AuthUser(res, await EncodeToken(auth_token), Number(user_id))
    if (Auth) {
        await knex('posts').where({post_id: Number(post_id)}).del()
        .catch(e => res.send({error: "Post was not found", status: 0}))
        res.send({response: "Post has been deleted", status: 1})
    }
    else {
        res.send({response: "User is not logged", status: 0})
    }
})

app.get('/api/posts/filter', async (req, res) => { 
    const {type, limit, offset} = req.headers
    var posts; 
    var hasNext;
    
    switch(type) {
        case "recently":
            posts = await knex('posts').select('*').limit(limit).offset(offset).orderBy('timestamp') 
            hasNext = (await knex('posts').select('*').limit(1).offset(offset+limit+1).orderBy('timestamp') )[0] ? true : false
        break;
        case "rating":
            posts = await knex('posts').select('*').limit(limit).offset(offset).orderBy('comment_count') 
            hasNext = (await knex('posts').select('*').limit(1).offset(offset+limit+1).orderBy('comment_count'))[0] ? true : false
        break;
        default:
            posts = await knex('posts').select('*').limit(limit).offset(offset).orderBy('update_id') 
            hasNext = (await knex('posts').select('*').limit(1).offset(offset+limit+1).orderBy('update_id') )[0] ? true : false
        break;
    }

    if (posts.length <= 0) {
        res.send({response: "Posts were not found", status: 0})
    }
    else {
        res.send({response: {posts, offset, limit, hasNext}, status: 1})
    }
    
})

/* Admin functional
*
*/

app.get('/api/admin/mposts', async (req, res) => { 
    var {auth_token, user_id, offset} = req.query // NO AUTHOR_ID USER_ID
    const Auth = await AdminUser(res, await EncodeToken(auth_token), user_id)
    var limit = 3
    if (Auth) {
        const posts = await knex('posts').offset(Number(offset)).limit(limit).where({status: 0}).select("*")
        for (post of posts) {
            let author = (await knex('users').where({user_id: post["author_id"]}).select("*"))[0]
            post["author_name"] = author["user_name"]
            post["author_image"] = author["user_image"]
            post["city_name"] = (await knex('cities').where({city_id: post["city_id"]}).select("*"))[0]["city_name"]
            let category = (await knex('categories').where({category_id: post["category_id"]}).select("*"))[0]
            post["pcategory_id"] = category["parent_id"]
            let pcategory = (await knex('categories').where({parent_id: post["category_id"]}).select("*"))[0]
            let name = pcategory ? pcategory["category_name"] : null
            let pname = category["category_name"]
            post["category_path"] = pname === 0 ? `${name}` : `${pname} > ${name}`
        }

        if (posts.length <= 0) return res.send({error: "Posts were not found", status: 0})
        res.send({response: {posts}, status: 1})
    }
    else {
        res.send({response: "User is not logged", status: 0})
    }
})

app.get('/api/admin/oposts', async (req, res) => { 
    var {auth_token, user_id} = req.query // NO AUTHOR_ID USER_ID
    const Auth = await AdminUser(res, await EncodeToken(auth_token), user_id)
    var limit = 10
    if (Auth) {
        const posts = await knex('posts').limit(limit).where({status: 1}).select("*")
        for (post of posts) {
            let author = (await knex('users').where({user_id: post["author_id"]}).select("*"))[0]
            post["author_name"] = author["user_name"]
            post["author_image"] = author["user_image"]
            post["city_name"] = (await knex('cities').where({city_id: post["city_id"]}).select("*"))[0]["city_name"]
            let category = (await knex('categories').where({category_id: post["category_id"]}).select("*"))[0]
            post["pcategory_id"] = category["parent_id"]
            let pcategory = (await knex('categories').where({parent_id: post["category_id"]}).select("*"))[0]
            let name = pcategory ? pcategory["category_name"] : null
            let pname = category["category_name"]
            post["category_path"] = pname === 0 ? `${name}` : `${pname} > ${name}`
        }

        if (posts.length <= 0) return res.send({error: "Posts were not found", status: 0})
        res.send({response: {posts}, status: 1})
    }
    else {
        res.send({response: "User is not logged", status: 0})
    }
})

app.get('/api/admin/dposts', async (req, res) => { 
    var {auth_token, user_id} = req.query // NO AUTHOR_ID USER_ID
    const Auth = await AdminUser(res, await EncodeToken(auth_token), user_id)
    var limit = 10
    if (Auth) {
        const posts = await knex('posts').limit(limit).where({status: 2}).select("*")
        for (post of posts) {
            let author = (await knex('users').where({user_id: post["author_id"]}).select("*"))[0]
            post["author_name"] = author["user_name"]
            post["author_image"] = author["user_image"]
            post["city_name"] = (await knex('cities').where({city_id: post["city_id"]}).select("*"))[0]["city_name"]
            let category = (await knex('categories').where({category_id: post["category_id"]}).select("*"))[0]
            post["pcategory_id"] = category["parent_id"]
            let pcategory = (await knex('categories').where({parent_id: post["category_id"]}).select("*"))[0]
            let name = pcategory ? pcategory["category_name"] : null
            let pname = category["category_name"]
            post["category_path"] = pname === 0 ? `${name}` : `${pname} > ${name}`
        }

        if (posts.length <= 0) return res.send({error: "Posts were not found", status: 0})
        console.log('posts',posts);
        res.send({response: {posts}, status: 1})
    }
    else {
        res.send({response: "User is not logged", status: 0})
    }
})

app.get('/api/admin/formpost', async (req, res) => { 
    var {auth_token, post_id, user_id, status} = req.query // NO AUTHOR_ID USER_ID
    const Auth = await AdminUser(res, await EncodeToken(auth_token), user_id)
    if (Auth) {
        const post = (await knex('posts').where({post_id: Number(post_id)}).update({status: Number(status)}, ["post_id"]))[0]
        res.send({response: "Post status has been edited", status: 1})
    }
    else {
        res.send({response: "User is not logged", status: 0})
    }
})

/* Utils Engine
*
*/

app.get('/api/search', async (req, res) => { 
    const {text, name, category_id} = req.query
    if (!text) return
    let offset = 5

    // Iterate DB QUERIES
    var formData = ""
    if (name && category_id) {
        let city = await knex('cities').where({city_query: name}).select('*')
        console.log('city',city);
        if (city.length > 0) {
            var formData = " AND"
            console.log(city);
            let city_id = city[0]["city_id"]
            formData += "`city_id` = "+city_id+" AND `category_id` = "+category_id
        }
    }
    if (name && !category_id) {
        var formData = " AND"
        let city = await knex('cities').where({city_query: name}).select('*')
        if (city.length > 0) {
            var formData = " AND"
            console.log(city);
            let city_id = city[0]["city_id"]
            formData += "`city_id` = "+city_id+" AND `category_id` = "+category_id
        }
    }

    var posts = (await knex.raw("SELECT * FROM `posts` WHERE `post_name` LIKE '"+text+"' OR `post_description` LIKE '"+text+"' OR `item_table1` LIKE '"+text+"' OR `item_table2` LIKE '"+text+"' OR `item_table3` LIKE '"+text+"' OR `item_table4` LIKE '"+text+"'"+formData))[0]
    let status = 0
    if (posts.length > 0) status = 1
    res.send({response: {posts}, status})
})

app.get('/image/:name', async (req, res) => { 
    res.sendFile(path.join(__dirname+'/avatars/'+req.params.name))
})

app.get('/posts/:name', async (req, res) => { 
    res.sendFile(path.join(__dirname+'/posts/'+req.params.name))
})

app.listen(1001, () => {
    console.log(`Example app listening at http://localhost:${1001}`)
})

async function setFilePop() {
    let categories = await knex('categories').select("*")
    console.log(categories);
    json2xlsx.write("cities.xlsx", "categories", categories);
}

// setFilePop()