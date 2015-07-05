/**
* Module dependencies.
*/

var request = require('superagent')
  , _ = require('underscore')
  , BASE_URL = 'https://venmo.com/'
  , API_URL = 'https://api.venmo.com/v1/'
  , SANDBOX_URL = 'https://sandbox-api.venmo.com/v1/';

/**
* Module exports.
*/

module.exports = Venmo;

/**
* Venmo client.
*/

function Venmo (access_token) {
  this.access_token = access_token;
  this.url = API_URL;
}

/**
* Transaction function.
*
* @param {Object} query
* @param {Function} callback
* @api private
*/
function transaction(query, callback) {
  var url = BASE_URL;

  if (query.user) {
    url += query.user + '?txn=' + query.transaction;
  } else {
    url += '?txn=' + query.transaction;
  }
  if (query.amount) {
    url += '&amount=' + query.amount;
  }
  if (query.note) {
    url += '&note=' + query.note.replace(/ /g,"+");
  }
  if (query.share) {
    var share = '';

    if (!(_.contains(query.share, 'Venmo') || _.contains(query.share, 'Facebook') || _.contains(query.share, 'Twitter'))) {
      return callback(new Error('Error thrown by venmo.js: Invalid sharing options. Valid options are \'Venmo\', \'Facebook\' and \'Twitter\'.'));
    } else {
      if (_.contains(query.share, 'Venmo')) {
        share += 'v';
      }
      if (_.contains(query.share, 'Facebook')) {
        share += 'f';
      }
      if (_.contains(query.share, 'Twitter')) {
        share += 't';
      }
    }

    if ((_.contains(share, 'f') || _.contains(share, 't') && !_.contains(share, 'v'))) {
      share += 'v';
    }
    url += '&share=' + share;
  }
  if (query.recipients) {
    url += '&recipients=' + query.recipients;
  }

  return callback(null, url);
}

Venmo.prototype.toggleSandbox =  function(useSandbox) {
  if(useSandbox)this.url = SANDBOX_URL;
  else this.url = API_URL;

}

Venmo.prototype.testInSandbox = function(userID, note, amount, callback){
      //Test POST
      request
      .post(SANDBOX_URL + "payments")
      .query({access_token: this.access_token, user_id: userID, note: note, amount:amount})
      .send({access_token: this.access_token})
      .type('json')
      .end(function (err, res) {
        //console.log(err.message);
        console.log(res.body);
        if (res.body && _.isArray(res.body.data)) {
          return callback(null, _.first(res.body.data));
        } else {
         callback(new Error('Error thrown by venmo.js: Bad venmo response. Check to make sure you are passing a valid phone number for a user signed up with Venmo.'));
        }
      });
    }

/**
 * Charge a Venmo user.
 *
 * @param  {String} userID
 * @param  {String} note
 * @param  {Float} amount
 * @param  {Function} callback
 * @return {Object} data
 * @api public
 */
Venmo.prototype.chargeUser = function(queryUser, note, amount, callback){
  this.payUser(queryUser, note, -1*amount, callback);
}

/**
 * Pay a Venmo user.
 *
 * @param  {String} userID
 * @param  {String} note
 * @param  {Float} amount
 * @param  {Function} callback
 * @return {Object} data
 * @api public
 */
Venmo.prototype.payUser = function(queryUser, note, amount, callback){
    //Query User
    var query = {}
    if (queryUser.userID) {
      _.extend(query, {user_id:queryUser.userID});
    }
    if (queryUser.phone) {
      _.extend(query, {phone:queryUser.phone});
    }
    if (queryUser.email) {
      _.extend(query, {email:queryUser.email});
    }
    if(typeof note === "string") {
      _.extend(query, {note:note});
    } else {
      throw Error("Must specifiy note as string.");
    }
    if(typeof amount === "number") {
      _.extend(query, {amount:amount});
    } else {
      throw Error("Must specifiy amount as number.");
    }
    //console.log(query);
    request
      .post(this.url + 'payments')
      .query(_.extend({ access_token: this.access_token }, query))
      .send({access_token: this.access_token})
      .type('json')
      .end(function (err, res) {
        if (res.body) {
          return callback(null, res.body.data);
        } else {
         if(err) console.log(err.message);
         callback(new Error('Error thrown by venmo.js: Bad venmo response.'));
        }
      });
}

/**
* Pay Link function.
*
* @param {Object} query
* @param {Function} callback
* @api public
*/

Venmo.prototype.payLink = function (query, callback) {
  transaction(_.extend(query, { transaction: 'pay' }), function (error, url) {
    if (error) {
      return callback(error);
    } else {
      return callback(null, url);
    }
  });
}

/**
* Charge Link function.
*
* @param {Object} query
* @param {Function} callback
* @api public
*/

Venmo.prototype.chargeLink = function (query, callback) {
  transaction(_.extend(query, { transaction: 'charge' }), function (error, url) {
    if (error) {
      return callback(error);
    } else {
      return callback(null, url);
    }
  });
}

/**
* Get User function.
*
* @param {Object} query
* @param {Function} callback
* @return {Object} data
* @api public
*/
Venmo.prototype.getCurrentUser = function (callback) {
  return this.getUser("me", callback);
}

Venmo.prototype.getUser = function (userID, callback) {
  var url = this.url + 'users/' + userID
    , data = {};
  if(userID==="me") url = this.url + 'me';
  request.get(url)
    .query(_.extend({access_token: this.access_token}, data))
    .send({access_token: this.access_token})
    .type('json')
    .end(function (err, res) {
      if (res.body) {
        return callback(null, res.body.data);
      } else {
        callback(new Error('Error thrown by venmo.js: Bad venmo response.'));
      }
    });
}

/**
 * Get Users friendlist from Venmo.
 *
 * @param  {String} userID
 * @param  {Function} callback
 * @return {Object} data
 * @api public
 */

Venmo.prototype.getFriends = function (userID, callback) {
  var url = this.url + 'users/'+userID+'/friends'
    , data = {};
  request.get(url)
    .query(_.extend({access_token: this.access_token}, data))
    .send({access_token: this.access_token})
    .type('json')
    .end(function (err, res) {
      if (res.body && _.isArray(res.body.data)) {
        return callback(null, res.body.data);
      } else {
        callback(new Error('Error thrown by venmo.js: Bad venmo response.'));
      }
    });
}

/**
* Find function.
*
* @param {Object} query
* @param {Function} callback
* @api public
* @deprecated Does not work with current Venmo API.
*/
Venmo.prototype.find = function (query, callback) {
  var url = BASE_URL + 'api/v2/user/find'
    , data = {};

  if (query.emails) {
    _.extend(data, { emails: query.emails });
  }
  if (query.phone_numbers) {
    _.extend(data, { phone_numbers: query.phone_numbers });
  }
  if (query.facebook_ids) {
    _.extend(data, { facebook_ids: query.facebook_ids });
  }
  if (query.foursquare_ids) {
    _.extend(data, { foursquare_ids: query.foursquare_ids });
  }
  if (query.twitter_screen_names) {
    _.extend(data, { twitter_screen_names: query.twitter_screen_names });
  }

  request.get(url)
    .query(_.extend({ client_id: this.client_id, client_secret: this.client_secret }, data))
    .end(function (res) {
      if (res.body && _.isArray(res.body.data)) {
        return callback(null, res.body.data);
      } else {
        callback(new Error('Error thrown by venmo.js: Bad venmo response.'));
      }
    });
}

/**
* Find by email convenience function.
*
* @param {String} email
* @param {Function} callback
* @api public
* @deprecated Does not work with current Venmo API.
*/

Venmo.prototype.findByEmail = function (email, callback) {
  request.get(BASE_URL + 'api/v2/user/find')
    .query(_.extend({ client_id: this.client_id, client_secret: this.client_secret }, { emails: email }))
    .end(function (res) {
      if (res.body && _.isArray(res.body.data)) {
        return callback(null, _.first(res.body.data));
      } else {
        callback(new Error('Error thrown by venmo.js: Bad venmo response. Check to make sure you are passing a valid email address for a user signed up with Venmo.'));
      }
    });
}

/**
* Find by phone number convenience function.
*
* @param {Number} phone
* @param {Function} callback
* @api public
* @deprecated Does not work with current Venmo API.
*/

Venmo.prototype.findByPhoneNumber = function (phone, callback) {
  request.get(BASE_URL + 'api/v2/user/find')
    .query(_.extend({ client_id: this.client_id, client_secret: this.client_secret }, { phone_numbers: phone }))
    .end(function (res) {
      if (res.body && _.isArray(res.body.data)) {
        return callback(null, _.first(res.body.data));
      } else {
        callback(new Error('Error thrown by venmo.js: Bad venmo response. Check to make sure you are passing a valid phone number for a user signed up with Venmo.'));
      }
    });
}

/**
* Find by Facebook ID convenience function.
*
* @param {Number} facebook_id
* @param {Function} callback
* @api public
* @deprecated Does not work with current Venmo API.
*/

Venmo.prototype.findByFacebookId = function (facebook_id, callback) {
  request.get(BASE_URL + 'api/v2/user/find')
    .query(_.extend({ client_id: this.client_id, client_secret: this.client_secret }, { facebook_ids: facebook_id }))
    .end(function (res) {
      if (res.body && _.isArray(res.body.data)) {
        return callback(null, _.first(res.body.data));
      } else {
        callback(new Error('Error thrown by venmo.js: Bad venmo response. Check to make sure you are passing a valid Facebook ID for a user signed up with Venmo.'));
      }
    });
}

/**
* Find by Foursquare ID convenience function.
*
* @param {Number} foursquare_id
* @param {Function} callback
* @api public
* @deprecated Does not work with current Venmo API.
*/

Venmo.prototype.findByFoursquareId = function (foursquare_id, callback) {
  request.get(BASE_URL + 'api/v2/user/find')
    .query(_.extend({ client_id: this.client_id, client_secret: this.client_secret }, { foursquare_ids: foursquare_id }))
    .end(function (res) {
      if (res.body && _.isArray(res.body.data)) {
        return callback(null, _.first(res.body.data));
      } else {
        callback(new Error('Error thrown by venmo.js: Bad venmo response. Check to make sure you are passing a valid Foursquare ID for a user signed up with Venmo.'));
      }
    });
}

/**
* Find by Twitter convenience function.
*
* @param {String} twitter_name
* @param {Function} callback
* @api public
* @deprecated Does not work with current Venmo API.
*/

Venmo.prototype.findByTwitter = function (twitter_name, callback) {
  request.get(BASE_URL + 'api/v2/user/find')
    .query(_.extend({ client_id: this.client_id, client_secret: this.client_secret }, { twitter_screen_names: twitter_name }))
    .end(function (res) {
      if (res.body && _.isArray(res.body.data)) {
        return callback(null, _.first(res.body.data));
      } else {
        callback(new Error('Error thrown by venmo.js: Bad venmo response. Check to make sure you are passing a valid Twitter for a user signed up with Venmo.'));
      }
    });
}
