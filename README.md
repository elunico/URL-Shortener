# URL-Shortener
A simple URL shortener in using Node, Express, and sqlite3

## Shorten URLs

Open the homepage (coming soon!) of the website and you will be presented with a text input. Paste in your URL and click "shorten" and you will be
given a link a shortened link. All shortened links have the form &lt;host&gt;/v/&lt;id&gt; where &lt;id&gt; is a case-sensitive 6 character
alphanumeric-plus-underscore-and-dash URL id.

Simply open the shortened link to be taken to the corresponding webpage

## API

You can also access the URL shortener via API. POST a request to `/create` with a JSON body that includes a `url: string` field. The response will be JSON in the form of `{success: boolean, path: string}` where `path` is the
short URL id. The url can then be accessed at `http://url.eluni.co/v/<path>`

## Rate Limiting

Regardless of whether you use the API directly or the client-side interface, you are limited to creating 50 short
URLs an hour and you are also limited to the number of redirects you can perform using a short link to 100 every minute.

## Todo

*  [x]  **Add rate limiting**
*  [x]  **Sanitize URL inputs**
*  [x]  **Change port host string to env variables so it can be deployed**
*  [ ]  **Guard some routes for development behind node_environment**
*  [x]  **Possibly create more IDs for URLs. With the 6 char identifiers there are 68,719,476,736 possible urls that can be kept. Increasing to 2 groups of 4
would allow for 248,155,780,267,521 URLs considering the hypen would be used to separate groups and no longer be valid in the URL ID itself**
*  [ ]  *Clear out old URLs after a while? How long if at all?*
*  [ ]  Add some CSS to make the pages look nicer
