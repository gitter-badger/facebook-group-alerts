# Facebook Group Alerts

This tool automatically notifies you of interesting posts published in preconfigured Facebook groups. It runs every hour, fetching each group's feed and marking each post as interesting or garbage, based on the configurable `whitelist` and `blacklist` rules. Once an interesting post is detected, it automatically sends an e-mail alert to preconfigured e-mails with the post link and content.

## Use Case

Facebook Group Alerts can be used to receive alerts about interesting apartment rental posts. This is useful in case you are a member of several Facebook groups whose members post all sorts of apartment rental listing posts and you wish to filter them according to specific parameters (such as the number of bedrooms, pet allowance, etc), all while getting a near-realtime notification as soon as they are posted, so you can snatch one of the apartments before somebody else does.

# Requirements

* MongoDB instance to avoid duplicate alerts
* Node.js `v4.2.x+` for ES6 generators support
* Facebook User Access Token to read the groups' feeds
* Amazon Web Services account (free tier) + Amazon SES (Simple Email Service) to send the alert emails
* Facebook application with `v2.3` Graph API version for requesting the deprecated `user_groups` permission (this one is a bit tricky)

# Instructions

1. Set the MongoDB database uri in the `config.js` file (get a free MongoDB database at [MongoLab](https://mongolab.com/))
2. Generate a Facebook User Access Token:
   1. Go to the [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   2. Select your application from the dropdown in the top right
   2. Select `v2.3` as the API version in the request URI input field
   3. Click Get Token -> **Get User Access Token**
   4. Select the `user_groups` permission (it won't show up unless you selected `v2.3` as the API version)
   5. Click **Get Access Token**
3. Extend the Facebook User Access Token:
    1. Visit the following URL, replacing each `{variable}` with its corresponding value:
        * `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id={app-client-id}&client_secret={app-client-secret}&fb_exchange_token={user-access-token}`
    2. Make sure the access token in the response is set to expire in 2 months by using the [Facebook Debugger](https://developers.facebook.com/tools/debug/) (Yes, you'll have to regenerate and re-extend the access token every 2 months, unfortunately)
    3. Copy the entire access token to the `config.js` file (set it in `sources.facebook.access_token`)
4. Set the Facebook group IDs to scan within the `sources.facebook.groups` array:
    * Execute a request to `https://graph.facebook.com/v2.3/me/groups?access_token={user-access-token}` to retrieve your Facebook account's group IDs
5. Set up Amazon SES to send the alert e-mails
    1. Sign up for [Amazon SES](https://console.aws.amazon.com/ses/home?region=us-east-1)
    2. Verify alert e-mail sender and recipient e-mails
    3. Create an [AWS IAM User](https://console.aws.amazon.com/iam/home?region=us-east-1#security_credential)
    4. Copy the IAM user's **Access Key ID** & **Secret Access Key** to the `config.js` file within the `alerts.ses` object
    5. Attach the `AmazonSESFullAccess` policy to the IAM user
6. Configure the whitelist and blacklist keyword arrays to control which posts are marked as interesting and which are ignored
    1. Set the `filter.blacklist` array with phrases in posts that will mark a post as "not interesting", such as "no pets"
    2. Set the `filter.whitelist` array with phrases in posts that will mark a post as "interesting", such as "renovated"
7. Run `npm install && npm start` to test it out (you may receive lots of e-mails if configured loosely)
8. If everything works as expected, deploy to a cloud service of your choice (AWS Elastic Beanstalk recommended, using the free tier)
9. Enjoy automated alerts about interesting posts delivered straight to your inbox!

# Collaborating

* If you find a bug or wish to make some kind of change, please create an issue first
* Make your commits as tiny as possible - one feature or bugfix at a time
* Write detailed commit messages, in-line with the project's commit naming conventions
* Make sure your code conventions are in-line with the project

# License

Apache 2.0