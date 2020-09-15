const request = require('supertest');
const app = require('../app');
const { generateToken } = require('../helpers/jwt');
const { sequelize } = require('../models');
const { queryInterface } = sequelize;
const { User, Product, Category } = require('../models');

let access_token_admin;
let access_token_customer;

let category;
let createdProduct;
let updatedProduct;

beforeAll(async done => {
	try {
		// Create & Update User as admin
		const userAdmin = await User.create({
			email: 'admin@mail.com',
			password: '1234',
		});
		const userAdminUpdated = await User.update({ role: 'admin' }, { where: { id: userAdmin.id }, returning: true });
		// Create User as customer (default)
		const userCustomer = await User.create({
			email: 'customer@mail.com',
			password: '1234',
		});

		// Generate JWT access_token
		access_token_admin = generateToken(userAdminUpdated);
		access_token_customer = generateToken(userCustomer);

		// Create Category
		category = await Category.create({
			name: 'Basic',
			slug: 'basic',
		});

		done();
	} catch (error) {
		done(error);
	}
});

afterAll(async done => {
	try {
		await queryInterface.bulkDelete('Users', null, {});
		await queryInterface.bulkDelete('Products', null, {});
		await queryInterface.bulkDelete('Categories', null, {});
		done();
	} catch (error) {
		done(error);
	}
});

describe('POST /products', function () {
	const product = {
		name: 'Basic T-Shirt',
		image_url: 'https://imgur.com/a/W0gzfu9',
		price: 45000,
		stock: 5,
		slug: 'basic-t-shirt',
		CategoryId: category.id,
	};

	test(`201: Success create product, return json with product's data`, function (done) {
		request(app)
			.post('/products')
			.send(product)
			.set('access_token', access_token_admin)
			.then(response => {
				const { statusCode, body } = response;

				createdProduct = { ...body };

				expect(statusCode).toBe(201);
				expect(body).toHaveProperty('id', expect.any(Number));
				expect(body).toHaveProperty('name', product.name);
				expect(body).toHaveProperty('image_url', product.image_url);
				expect(body).toHaveProperty('price', product.price);
				expect(body).toHaveProperty('stock', product.stock);
				expect(body).toHaveProperty('slug', product.slug);
				expect(body).toHaveProperty('CategoryId', product.CategoryId);
				done();
			})
			.catch(err => {
				done(err);
			});
	});

	const productEmpty = {
		name: '',
		image_url: '',
		price: '',
		stock: '',
		slug: '',
		CategoryId: '',
	};

	test('400: Error validation: required field cannot empty', function (done) {
		const expectedErrors = [
			{
				name: 'notEmpty',
				message: 'Name cannot empty',
			},
			{
				name: 'notEmpty',
				message: 'Image url cannot empty',
			},
			{
				name: 'notEmpty',
				message: 'Slug cannot empty',
			},
			{
				name: 'notEmpty',
				message: 'Price cannot empty',
			},
			{
				name: 'notEmpty',
				message: 'Stock cannot empty',
			},
			{
				name: 'notEmpty',
				message: 'Category id cannot empty',
			},
		];

		request(app)
			.post('/products')
			.send(productEmpty)
			.set('access_token', access_token_admin)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(400);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(err => {
				done(err);
			});
	});

	const productNull = {};

	test('400: Error validation: required field cannot null', function (done) {
		const expectedErrors = [
			{
				name: 'is_null',
				message: 'Name cannot null',
			},
			{
				name: 'is_null',
				message: 'Image url cannot null',
			},
			{
				name: 'is_null',
				message: 'Slug cannot null',
			},
			{
				name: 'is_null',
				message: 'Price cannot null',
			},
			{
				name: 'is_null',
				message: 'Stock cannot null',
			},
			{
				name: 'is_null',
				message: 'Category id cannot null',
			},
		];

		request(app)
			.post('/products')
			.send(productNull)
			.set('access_token', access_token_admin)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(400);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(err => {
				done(err);
			});
	});

	const productStockNegative = {
		name: 'Basic T-Shirt',
		image_url: 'https://imgur.com/a/W0gzfu9',
		price: 45000,
		stock: -1,
		slug: 'basic-t-shirt',
		CategoryId: category.id,
	};

	test('400: Error validation: stock negative values', function (done) {
		const expectedErrors = [
			{
				name: 'isInt',
				message: 'Stock must be positive numbers with no leading zeroes',
			},
		];

		request(app)
			.post('/products')
			.send(productStockNegative)
			.set('access_token', access_token_admin)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(400);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(err => {
				done(err);
			});
	});

	const productPriceNegative = {
		name: 'Basic T-Shirt',
		image_url: 'https://imgur.com/a/W0gzfu9',
		price: -1,
		stock: 5,
		slug: 'basic-t-shirt',
		CategoryId: category.id,
	};

	test('400: Error validation: stock negative values', function (done) {
		const expectedErrors = [
			{
				name: 'isInt',
				message: 'Price must be positive numbers with no leading zeroes',
			},
		];

		request(app)
			.post('/products')
			.send(productPriceNegative)
			.set('access_token', access_token_admin)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(400);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(err => {
				done(err);
			});
	});

	const productStockString = {
		name: 'Basic T-Shirt',
		image_url: 'https://imgur.com/a/W0gzfu9',
		price: 45000,
		stock: 'string',
		slug: 'basic-t-shirt',
		CategoryId: category.id,
	};

	test('400: Error validation: stock negative values', function (done) {
		const expectedErrors = [
			{
				name: 'isInt',
				message: 'Stock must be positive numbers with no leading zeroes',
			},
		];

		request(app)
			.post('/products')
			.send(productStockString)
			.set('access_token', access_token_admin)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(400);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(err => {
				done(err);
			});
	});

	const productPriceString = {
		name: 'Basic T-Shirt',
		image_url: 'https://imgur.com/a/W0gzfu9',
		price: 'string',
		stock: 5,
		slug: 'basic-t-shirt',
		CategoryId: category.id,
	};

	test('400: Error validation: stock negative values', function (done) {
		const expectedErrors = [
			{
				name: 'isInt',
				message: 'Price must be positive numbers with no leading zeroes',
			},
		];

		request(app)
			.post('/products')
			.send(productPriceString)
			.set('access_token', access_token_admin)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(400);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(err => {
				done(err);
			});
	});

	test('401: Unauthenticated because no access_token, return json with error', function (done) {
		const expectedErrors = [
			{
				name: 'notAuthenticated',
				message: 'User not authenticated',
			},
		];

		request(app)
			.post('/products')
			.send(product)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(401);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(error => {
				done(error);
			});
	});

	test('403: Role is not admin, return json with error', function (done) {
		const expectedErrors = [
			{
				name: 'notAuthorizedUser',
				message: 'User not authorized perform this action',
			},
		];

		request(app)
			.post('/products')
			.send(product)
			.set('access_token', access_token_customer)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(403);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(error => {
				done(error);
			});
	});
});

describe('GET /products', function () {
	const products = [{ ...createdProduct }];

	test(`200: Success get all products, return json with product's data`, function (done) {
		request(app)
			.get('/products')
			.set('access_token', access_token_admin)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(200);
				expect(body).toEqual(expect.arrayContaining(products));
				done();
			})
			.catch(err => {
				done(err);
			});
	});

	test('401: Unauthenticated because no access_token, return json with error', function (done) {
		const expectedErrors = [
			{
				name: 'notAuthenticated',
				message: 'User not authenticated',
			},
		];

		request(app)
			.get('/products')
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(401);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(error => {
				done(error);
			});
	});
});

describe('GET /products/:id', function () {
	test(`200: Success get product by id, return json with product's data`, function (done) {
		request(app)
			.get(`/products/${createdProduct.id}`)
			.set('access_token', access_token_admin)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(200);
				expect(body).toEqual(createdProduct);
				done();
			})
			.catch(err => {
				done(err);
			});
	});

	test('404: Error product not found, return json with error', function (done) {
		const expectedErrors = [
			{
				name: 'notFoundProduct',
				message: 'Error product not found',
			},
		];

		request(app)
			.get(`/products/1234`)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(404);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(error => {
				done(error);
			});
	});

	test('401: Unauthenticated because no access_token, return json with error', function (done) {
		const expectedErrors = [
			{
				name: 'notAuthenticated',
				message: 'User not authenticated',
			},
		];

		request(app)
			.get('/products')
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(401);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(error => {
				done(error);
			});
	});
});

describe('PUT /products/:id', function () {
	const productToUpdate = { ...createdProduct };
	productToUpdate.name = 'updated name';

	test(`200: Success update product, return json with updated product's data`, function (done) {
		request(app)
			.put(`/products/${productToUpdate.id}`)
			.send(productToUpdate)
			.set('access_token', access_token_admin)
			.then(response => {
				const { statusCode, body } = response;

				updatedProduct = { ...body };

				expect(statusCode).toBe(200);
				expect(body).toHaveProperty('id', productToUpdate.id);
				expect(body).toHaveProperty('name', productToUpdate.name);
				expect(body).toHaveProperty('image_url', productToUpdate.image_url);
				expect(body).toHaveProperty('price', productToUpdate.price);
				expect(body).toHaveProperty('stock', productToUpdate.stock);
				expect(body).toHaveProperty('slug', productToUpdate.slug);
				expect(body).toHaveProperty('CategoryId', productToUpdate.CategoryId);
				done();
			})
			.catch(err => {
				done(err);
			});
	});

	test('404: Error product not found, return json with error', function (done) {
		const expectedErrors = [
			{
				name: 'notFoundProduct',
				message: 'Error product not found',
			},
		];

		request(app)
			.put(`/products/1234`)
			.send(productToUpdate)
			.set('access_token', access_token_admin)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(404);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(error => {
				done(error);
			});
	});

	test('401: Unauthenticated because no access_token, return json with error', function (done) {
		const expectedErrors = [
			{
				name: 'notAuthenticated',
				message: 'User not authenticated',
			},
		];

		request(app)
			.put(`/products/${productToUpdate.id}`)
			.send(productToUpdate)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(401);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(error => {
				done(error);
			});
	});

	test('403: Role is not admin, return json with error', function (done) {
		const expectedErrors = [
			{
				name: 'notAuthorizedUser',
				message: 'User not authorized perform this action',
			},
		];

		request(app)
			.put(`/products/${productToUpdate.id}`)
			.send(product)
			.set('access_token', access_token_customer)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(403);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(error => {
				done(error);
			});
	});
});

describe('DELETE /products/:id', function () {
	test(`200: Success delete product, return json with deleted product's data`, function (done) {
		request(app)
			.delete(`/products/${updatedProduct.id}`)
			.send(updatedProduct)
			.set('access_token', access_token_admin)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(200);
				expect(body).toHaveProperty('id', updatedProduct.id);
				expect(body).toHaveProperty('name', updatedProduct.name);
				expect(body).toHaveProperty('image_url', updatedProduct.image_url);
				expect(body).toHaveProperty('price', updatedProduct.price);
				expect(body).toHaveProperty('stock', updatedProduct.stock);
				expect(body).toHaveProperty('slug', updatedProduct.slug);
				expect(body).toHaveProperty('CategoryId', updatedProduct.CategoryId);
				done();
			})
			.catch(err => {
				done(err);
			});
	});

	test('404: Error product not found, return json with error', function (done) {
		const expectedErrors = [
			{
				name: 'notFoundProduct',
				message: 'Error product not found',
			},
		];

		request(app)
			.put(`/products/1234`)
			.send(updatedProduct)
			.set('access_token', access_token_admin)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(404);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(error => {
				done(error);
			});
	});

	test('401: Unauthenticated because no access_token, return json with error', function (done) {
		const expectedErrors = [
			{
				name: 'notAuthenticated',
				message: 'User not authenticated',
			},
		];

		request(app)
			.delete(`/products/${updatedProduct.id}`)
			.send(updatedProduct)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(401);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(error => {
				done(error);
			});
	});

	test('403: Role is not admin, return json with error', function (done) {
		const expectedErrors = [
			{
				name: 'notAuthorizedUser',
				message: 'User not authorized perform this action',
			},
		];

		request(app)
			.delete(`/products/${updatedProduct.id}`)
			.send(updatedProduct)
			.set('access_token', access_token_customer)
			.then(response => {
				const { statusCode, body } = response;

				expect(statusCode).toBe(403);
				expect(body.errors).toEqual(expect.arrayContaining(expectedErrors));
				done();
			})
			.catch(error => {
				done(error);
			});
	});
});
