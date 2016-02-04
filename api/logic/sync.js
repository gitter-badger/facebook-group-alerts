// Dependencies
var ses = require('node-ses');
var request = require('koa-request');

// App modules
var posts = require('../model/posts');
var config = require('../../config');

// Amazon SES client
var ses = ses.createClient(config.alerts.ses);
  
// POST /sync
module.exports = function* () {
    // Log start
    console.log('[Facebook Group Alerts] Started syncing on ' + new Date().toUTCString());
    
    // Traverse preconfigured Facebook groups
    for (var groupID of config.sources.facebook.groups) {
        // Log feed fetch along with group ID
        console.log('[' + groupID + ']' + ' Fetching feed...');
        
        // Build URL to group's feed
        var url = 'https://graph.facebook.com/v2.3/' + groupID + '/feed?access_token=' + config.sources.facebook.access_token;
        
        // Get JSON feed
        var response = yield request({ json: true, url: url });
        
        // Handle FB errors
        if (response.body.error) {
            throw response.body.error.message;
        }
        
        // Log post count
        console.log('[' + groupID + ']' + ' Checking ' + response.body.data.length + ' posts...');
        
        // Traverse posts
        for (var post of response.body.data) {
            // Some posts are links and don't have a message, skip them
            if (!post.message) {
                continue;
            }
            
            // Make sure this post interests us
            if (!exports.isPostInteresting(post.message)) {
                continue;
            }
            
            // Check if it already exists in our DB
            var exists = yield posts.find({ id: post.id });
            
            // Skip if it exists
            if (exists.length > 0) {
                continue;
            }
            
            // Log interesting post
            console.log('[' + post.id + ']' + ' Interesting post found');
            
            // Prepare Facebook group name for e-mail
            var groupName = post.to.data[0].name;
            
            // Prepare link to post for e-mail
            var postUrl = post.actions[0].link;
            
            // Build an e-mail with the post message and link
            var email = {
                from: config.alerts.from,
                bcc: config.alerts.to,
                subject: '[Facebook Group Alerts] Interesting post found',
                message: '<p dir="ltr">' + post.message + '<br /><br />' + groupName + ':<br />' + postUrl + "</p>"
            };
            
            // Send the alert e-mail
            yield exports.sendEmail(email);
            
            // Insert post to avoid re-sending an alert for this post ID
            yield posts.insert(post);
            
            // Log alert succcess
            console.log('[' + post.id + ']' + ' Alert e-mail sent');
        }
    }

    // Log sync end
    console.log('[Facebook Group Alerts] Finished syncing on ' + new Date().toUTCString());
};

exports.isPostInteresting = function (text) {
    // Case-insensitive matching
    text = text.toLowerCase();
    
    // Check for blacklist word occurrence
    for (var word of config.filter.blacklist) {
        if (text.indexOf(word) != -1) {
            return false;
        }
    }
    
    // Check for whitelist word occurrence
    for (var word of config.filter.whitelist) {
        if (text.indexOf(word) != -1) {
            return true;
        }
    }
    
    // Nothing matched
    return false;
}

exports.sendEmail = function (email) {
    // Promisify the function
    return new Promise(function (resolve, reject) {
        // Actually send the email
        ses.sendEmail(email, function (err, data, res) {
            if (err) {
                // Failed
                return reject(err);
            }
            
            // Success
            return resolve(data);
        });
    });
};