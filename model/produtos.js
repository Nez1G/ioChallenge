const mongoose = require('mongoose');

// MetodosPagamento Schema
const produtosSchema = mongoose.Schema({
	nome: {
        type: String,
        required: true
    },
    preco: {
        type: Number,
        required: true
    },
    descricao: {
        type: String,
        required: true
    }
},{
    versionKey: false
});

const Produtos = module.exports = mongoose.model('Produtos', produtosSchema, "produtos");

// Get Produtos
module.exports.getProdutos = (callback, limit) => {
    Produtos.find(callback).limit(limit);
}

// Get Produtos by ID
module.exports.getProdutosById = (id, callback) => {
	Produtos.findById(id, callback);
}

// Add Produtos
module.exports.addProduto = (produto, callback) => {
	Produtos.create(produto, callback);
}

// Update Produtos
module.exports.updateProduto = (id, produto, options, callback) => {
	var query = {_id: id};
	var update = {
        id: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        descricao: produto.descricao
	}
	Produtos.findOneAndUpdate(query, update, options, callback);
}


// Delete Produtos
module.exports.removeProduto = (id, callback) => {
	var query = {_id: id};
	Produtos.remove(query, callback);
}
