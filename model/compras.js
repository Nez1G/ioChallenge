const mongoose = require('mongoose');

// MetodosPagamento Schema
const comprasSchema = mongoose.Schema({
	email: {
        type: String,
        required: true
    },
    nome: {
        type: String,
        required: true
    },
    morada: {
        type: String,
        required: true
    },
    produto: {
        type: String,
        required: true
    },
    preco: {
        type: Number,
        required: true
    },
    metodoPagamento: {
        type: String,
        required: true
    }
},{
    versionKey: false
});

const Compras = module.exports = mongoose.model('Compras', comprasSchema, "compras");

// Get Compras
module.exports.getCompras = (callback, limit) => {
    Compras.find(callback).limit(limit);
}

// Get Compras by ID
module.exports.getComprasById = (id, callback) => {
	Compras.findById(id, callback);
}

// Add Compras
module.exports.addCompras = (compra, callback) => {
	Compras.create(compra, callback);
}

// Update Compras
module.exports.updateCompra = (id, compra, options, callback) => {
	var query = {_id: id};
	var update = {
        id: compra.id,
        nome: produto.nome,
        preco: produto.preco,
        descricao: produto.descricao
	}
	Compras.findOneAndUpdate(query, update, options, callback);
}


// Delete Compras
module.exports.removeCompra = (id, callback) => {
	var query = {_id: id};
	Compras.remove(query, callback);
}