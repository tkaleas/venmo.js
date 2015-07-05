var assert = require('assert')
  , Venmo = require('../venmo.js');

/**
* venmo.findByEmail("zafriedman@gmail.com", function (error, results) { console.log(results); });
* venmo.findByPhoneNumber(8182920209, function (error, results) { console.log(results); });
* venmo.findByFacebookId(8645350, function (error, results) { console.log(results); });
* venmo.findByFoursquareId(9972790, function (error, results) { console.log(results); });
* venmo.findByTwitter("_kulte", function (error, results) { console.log(results); });
*/

var api_key;
if(process.env.VENMO_API_KEY)
  api_key = process.env.VENMO_API_KEY;
else
  throw new Error("Must supply a private Venmo API Key as environment variable VENMO_API_KEY. Correct Usage: \'export VENMO_API_KEY=YOUR_KEY mocha test/*.js\'")


describe('Venmo', function () {
  var venmo = new Venmo(api_key.toString());
  //Sandbox testing
  venmo.toggleSandbox(true);
  var sandboxUserID = "145434160922624933";
  var sandboxEmail = "venmo@venmo.com";
  var sandboxPhone = "15555555555";

  describe('access_token', function () {
    it('should assign access_token when passed to the constructor', function () {
       assert.equal(venmo.access_token, api_key);
    });
  });

  describe('Payment Links', function() {
    //Paylink Testing
    describe('#payLink()', function () {
      it('should generate a proper payment url', function () {
        var object = {
          user: 'Zachary-Friedman'
        , amount: 100
        }
        var VALID_URL = 'https://venmo.com/Zachary-Friedman?txn=pay&amount=100'

        venmo.payLink(object, function (error, url) {
          if (error) {
            assert(false);
          } else {
            assert.equal(url, VALID_URL);
          }
        });
      })
      it('should accept a note property', function () {
        var object = {
          user: 'Zachary-Friedman'
        , amount: 100
        , note: 'for testing venmo.js'
        }
        var VALID_URL = 'https://venmo.com/Zachary-Friedman?txn=pay&amount=100&note=for+testing+venmo.js'

        venmo.payLink(object, function (error, url) {
          if (error) {
            assert(false);
          } else {
            assert.equal(url, VALID_URL);
          }
        });
      })
      it('should accept a share property', function () {
        var object = {
          user: 'Zachary-Friedman'
        , amount: 100
        , share: ["Venmo"]
        }
        var VALID_URL = 'https://venmo.com/Zachary-Friedman?txn=pay&amount=100&share=v'

        venmo.payLink(object, function (error, url) {
          if (error) {
            assert(false);
          } else {
            assert.equal(url, VALID_URL);
          }
        });
      })
      it('should append \'Venmo\' when it is not included with other valid share array elements', function () {
        var object = {
          user: 'Zachary-Friedman'
        , amount: 100
        , share: ["Facebook", "Twitter"]
        }
        var VALID_URL = 'https://venmo.com/Zachary-Friedman?txn=pay&amount=100&share=ftv'

        venmo.payLink(object, function (error, url) {
          if (error) {
            assert(false);
          } else {
            assert.equal(url, VALID_URL);
          }
        });
      })
      it('should throw an error when passed an invalid share property', function () {
        var object = {
          user: 'Zachary-Friedman'
        , amount: 100
        , share: ["Google+"]
        }

        venmo.payLink(object, function (error, url) {
          if (error) {
            assert(true);
          } else {
            assert(false);
          }
        });
      })
      it('should accept multiple recipients', function () {})
    })

    describe('#chargeLink()', function () {
      it('should generate a proper payment url', function () {
        var object = {
          user: 'Zachary-Friedman'
        , amount: 100
        }
        var VALID_URL = 'https://venmo.com/Zachary-Friedman?txn=charge&amount=100'

        venmo.chargeLink(object, function (error, url) {
          if (error) {
            assert(false);
          } else {
            assert.equal(url, VALID_URL);
          }
        });
      })

      it('should accept a note property', function () {
        var object = {
          user: 'Zachary-Friedman'
        , amount: 100
        , note: 'for testing venmo.js'
        }
        var VALID_URL = 'https://venmo.com/Zachary-Friedman?txn=charge&amount=100&note=for+testing+venmo.js'

        venmo.chargeLink(object, function (error, url) {
          if (error) {
            assert(false);
          } else {
            assert.equal(url, VALID_URL);
          }
        });
      })
      it('should accept a share property', function () {
        var object = {
          user: 'Zachary-Friedman'
        , amount: 100
        , share: ["Venmo"]
        }
        var VALID_URL = 'https://venmo.com/Zachary-Friedman?txn=pay&amount=100&share=v'

        venmo.payLink(object, function (error, url) {
          if (error) {
            assert(false);
          } else {
            assert.equal(url, VALID_URL);
          }
        });
      it('should accept multiple recipients', function () {});
      });
    });
  })
  describe("User Endpoint", function () {
    describe('#getUser()', function () {
      it('should get the current user', function (done) {
        venmo.getCurrentUser(function (err, res){
          assert(res.user.id);
          done();
        })
      });
      it('should get user info', function (done) {
        venmo.getUser(sandboxUserID, function (err, res){
          assert.equal(sandboxUserID, res.id);
          done();
        })
      });
      it('should get users friends', function (done) {
        venmo.getFriends(sandboxUserID, function (err, res){
          assert(res);
          done();
        })
      });
    });
  });

  //Test Payments Endpoint API
  describe("Payments Endpoint", function () {
    describe('#payUser()', function () {
      it('should create transaction using user ID', function (done) {
         var userQuery = {userID: sandboxUserID};
         venmo.payUser(userQuery, "Venmo Testing Charge", 0.10, function (err, res) {
          assert.equal(res.payment.status,"settled");
          done();
        })
      });
      it('should create transaction using email', function (done) {
         var userQuery = {email: sandboxEmail};
         venmo.payUser(userQuery, "Venmo Testing Charge", 0.10, function (err, res) {
          assert.equal(res.payment.status,"settled");
          done();
         })
      });
      it('should create transaction using phone number', function (done) {
         var userQuery = {phone: sandboxPhone};
         venmo.payUser(userQuery, "Venmo Testing Charge", 0.10, function (err, res) {
          assert.equal(res.payment.status,"settled");
          done();
         });
      });
      it('should create failed payment', function (done) {
         var userQuery = {userID: sandboxUserID};
        venmo.payUser(userQuery, "Venmo Testing Charge", 0.20, function (err, res) {
          assert.equal(res.payment.status,"failed");
          done();
        });
      });
      it('should create pending payment', function (done) {
        var userQuery = {userID: sandboxUserID};
        venmo.payUser(userQuery, "Venmo Testing Charge", 0.30, function (err, res) {
          assert.equal(res.payment.status,"pending");
          done();
        });
      });
    });
    describe('#chargeUser()', function (done) {
      it('should create settled charge', function (done) {
        var userQuery = {userID: sandboxUserID};
        venmo.chargeUser(userQuery, "Venmo Testing Charge", 0.10, function (err, res) {
          assert.equal(res.payment.status,"settled");
          assert.equal(res.payment.action,"charge");
          done();
        });
      });
      it('should create pending charge', function (done) {
        var userQuery = {userID: sandboxUserID};
        venmo.chargeUser(userQuery, "Venmo Testing Charge", 0.20, function (err, res) {
          assert.equal(res.payment.status,"pending");
          assert.equal(res.payment.action,"charge");
          done();
        });
      });
    });
    describe('#getRecentPayments()', function () {});
    describe('#getPaymentInfo()', function () {});
    describe('#completePayment()', function () {});
  });

});
