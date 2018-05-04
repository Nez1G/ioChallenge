const mongoose = require('mongoose');

// MetodosPagamento Schema
const metodosPagamentoSchema = mongoose.Schema({
	nome: {
        type: String,
        required: true
    }
},{
    versionKey: false
});

const MetodosPagamento = module.exports = mongoose.model('MetodosPagamento', metodosPagamentoSchema, "metodosPagamento");

// Get MetodosPagamento
module.exports.getMetodosPagamento = (callback, limit) => {
    MetodosPagamento.find(callback).limit(limit);
}

// Get MetodosPagamento by ID
module.exports.getMetodosPagamentoById = (id, callback) => {
	MetodosPagamento.findById(id, callback);
}

// Add MetodosPagamento
module.exports.addMetodosPagamento = (metodosPagamento, callback) => {
	MetodosPagamento.create(metodosPagamento, callback);
}

// Update MetodosPagamento
module.exports.updateMetodosPagamento = (id, metodosPagamento, options, callback) => {
	var query = {_id: id};
	var update = {
		nome: metodosPagamento.nome
	}
	MetodosPagamento.findOneAndUpdate(query, update, options, callback);
}


// Delete MetodosPagamento
module.exports.removeMetodosPagamento = (id, callback) => {
	var query = {_id: id};
	MetodosPagamento.remove(query, callback);
}
