const express = require('express');
const exphbs = require('express-handlebars');
const paypal = require('paypal-rest-sdk');
const wepay = require('wepay').WEPAY;
const expressValidator = require('express-validator');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const router = express.Router();
const port = process.env.PORT || 3000;
var idProduto, nomeProduto, precoProduto, descricaoProduto, compra, produto,quantidade;

//Imports das funções CRUD do mongo
MetodosPagamento = require('./model/metodosPagamento');
Produtos = require('./model/produtos');
Compras = require('./model/compras');

//Conexão ao mongoose
mongoose.connect('mongodb://localhost/ioChallenge');
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback(){
        console.log(`Connected to the ${db.name} database`);
});

//Configuração das credênciais do paypal
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'ARzlozAfw1m4hLw5YpYZMgoIQrWDA01oqgzhNOFGJXd0qr1nktqEEPF1yd85ivKYGTD34wxDoE3ugaao',
    'client_secret': 'ED6MtdRBLqYlJXvlqFCRY8LUxwn_ZET9HztqIAuKg5qO6gJBt9YHXn72CdMoG_RTN8JPDPafT8Q-4fwn'
  });

//Configuração das credênciais do wepay
var wepay_settings = {
	'client_id'     : '16430',
	'client_secret' : '8326287921',
	'access_token'  : 'STAGE_dd96a62685630f47461be07cf511c79f3e216492c5b22dcab4e41e6972a991f6', // used for oAuth2
	// 'api_version': 'API_VERSION'
}

var wp = new wepay(wepay_settings);
wp.use_staging(); // use staging environment (payments are not charged)


//Definição da engine to template
app.engine('handlebars', exphbs({defaultLayout: 'index'}));
app.set('view engine', 'handlebars');
//Suporta bodies encoded com json
app.use(bodyparser.json());
//Suporta encoded bodies
app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(expressValidator());

app.get('/', function(req, res) {
    Produtos.getProdutos((err, produtos) => {
		if(err){
            throw err;
            res.render('cancel');
        }
            res.render('produtos', {produto: produtos});
	});
    });

app.post('/wepay', (req,res) => {
    Produtos.getProdutosById(req.sanitizeBody('id').escape(), (err, produtos) => {
        if(err){
            throw err;
            res.render('cancel');
        }
         idProduto = produtos.id;
        nomeProduto = produtos.nome;
        precoProduto = produtos.preco;
        descricaoProduto = produtos.descricao;

        try {
            wp.call('/checkout/create',
                {
                    'account_id': 1433559669,
                    'amount': precoProduto,
                    'currency': 'USD',
                    'short_description': nomeProduto,
                    'long_description' : descricaoProduto,
                    'type': 'goods',
                    "delivery_type": "shipping",
                    "hosted_checkout": {
                        "redirect_uri": "http://localhost:3000/successWepay",
                        "fallback_uri": "http://localhost:3000/cancel",
                        "require_shipping": true,
                    }
                },
                function(response) {
                    res.redirect(response.hosted_checkout.checkout_uri);
                }
            );
        } catch (error) {
            console.log(error);
        }
    });
});

app.post('/pay', (req, res) => {
    Produtos.getProdutosById(req.sanitizeBody('id').escape(), (err, produtos) => {
        if(err){
            throw err;
            res.render('cancel');
        }
         idProduto = produtos.id;
        nomeProduto = produtos.nome;
        precoProduto = produtos.preco;
        descricaoProduto = produtos.descricao;

    const create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": "http://localhost:3000/success",
          "cancel_url": "http://localhost:3000/cancel"
      },
      "transactions": [{
          "item_list": {
              "items": [{
                  "name": nomeProduto,
                  "sku": idProduto,
                  "price": precoProduto,
                  "currency": "EUR",
                  "quantity": 1
              }]
          },
          "amount": {
              "currency": "EUR",
              "total": precoProduto
          },
          "description": descricaoProduto
      }]
  };

paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
        res.render('cancel');
        throw error;
    } else {
        for(let i = 0;i < payment.links.length;i++){
          if(payment.links[i].rel === 'approval_url'){
            res.redirect(payment.links[i].href);
          }
        }
    }
  });
  });
});

app.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
          "amount": {
              "currency": "EUR",
              "total": precoProduto
          }
      }]
    };
  
paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
        res.render('cancel');
    } else {
        compra = {
                email : payment.payer.payer_info.email,
                nome : payment.payer.payer_info.first_name+" "+payment.payer.payer_info.last_name,
                morada : payment.payer.payer_info.shipping_address.line1+" , "+payment.payer.payer_info.shipping_address.city+
                " , "+payment.payer.payer_info.shipping_address.state+" , "+payment.payer.payer_info.shipping_address.postal_code+
                " , "+payment.payer.payer_info.shipping_address.country_code,
                produto : payment.transactions[0].item_list.items[0].name,
                preco : payment.transactions[0].amount.total,
                metodoPagamento : 'PayPal'

        }
        Compras.addCompras(compra, (err, compras) => {
            if(err){
                throw err;
                res.render('cancel');
            }
        });
        res.render('sucess', {email : payment.payer.payer_info.email, primeiroNome : payment.payer.payer_info.first_name, 
            ultimoNome : payment.payer.payer_info.last_name, morada : payment.payer.payer_info.shipping_address.line1+" , "+payment.payer.payer_info.shipping_address.city+
            " , "+payment.payer.payer_info.shipping_address.state+" , "+payment.payer.payer_info.shipping_address.postal_code+
            " , "+payment.payer.payer_info.shipping_address.country_code, produto : payment.transactions[0].item_list.items[0].name, 
            preco : payment.transactions[0].amount.total, metodoPagamento : 'PayPal'});

    }
  });
  });
  
  app.get('/successWepay', (req, res) => {
    const payerId = req.query.checkout_id;
    try {
        wp.call('/checkout',
            {
                'checkout_id': payerId,
                
            },
            function(response) {
                compra = {
                    email : response.payer.email,
                    nome : response.payer.name,
                    morada : response.hosted_checkout.shipping_address.address1 + " , " + response.hosted_checkout.shipping_address.city + " , " +
                    response.hosted_checkout.shipping_address.region + " , " + response.hosted_checkout.shipping_address.postcode + " , " +
                    response.hosted_checkout.shipping_address.country,
                    produto : response.short_description,
                    preco : response.amount,
                    metodoPagamento : 'WePay'
    
            }
            Compras.addCompras(compra, (err, compras) => {
                if(err){
                    throw err;
                    res.render('cancel');
                }
            });
            res.render('successWepay', {email : response.payer.email, nome : response.payer.name, 
                morada : response.hosted_checkout.shipping_address.address1 + " , " + response.hosted_checkout.shipping_address.city + " , " +
                response.hosted_checkout.shipping_address.region + " , " + response.hosted_checkout.shipping_address.postcode + " , " +
                response.hosted_checkout.shipping_address.country, produto : response.short_description, 
                preco : response.amount, metodoPagamento : 'WePay'});
                
            }
        );
    } catch (error) {
        console.log(error);
    }
  });

app.get('/cancel', (req, res) => res.render('cancel'));

app.get('/compras', (req, res) => {
    Compras.getCompras((err, compras) => {
        if(err){
            throw err;
            res.render('cancel');
        }
        res.render('compras', {compras: compras});
    });
});

app.get('/gerirProdutos', (req, res) => {
    Produtos.getProdutos((err, produtos) => {
		if(err){
            throw err;
            res.render('cancel');
        }
            res.render('gerirProdutos', {produto: produtos});
	});
});

app.get('/adicionarProduto', (req, res) => {
    Compras.getCompras((err, compras) => {
        if(err){
            throw err;
            res.render('cancel');
        }
        res.render('adicionarProduto');
    });
});

app.post('/criarProduto', (req, res) => {
    produto = {
        nome : req.sanitizeBody('nome').escape(),
        preco : req.sanitizeBody('preco').escape(),
        descricao : req.sanitizeBody('descricao').escape()
    }
    Produtos.addProduto(produto, (err, produtos) => {
        if(err){
            throw err;
            res.render('cancel');
        }
        res.render('produtoCriado');
    })
});

app.get('/api/produtos', (req, res) => {
    Produtos.getProdutos((err, produtos) => {
        if(err){
            throw err;
        }
        res.json(produtos);
    });
});

app.delete('/removerProduto/:_id', (req, res) => {
    var id = req.params._id;
	Produtos.removeProduto(id, (err, produto) => {
		if(err){
			throw err;
		}
		res.render('produtoCriado');
	});
});

app.listen(port, () => console.log(`Listening on port ${port}`));
