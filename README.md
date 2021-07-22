# URL-Shortener
A simple URL shortener in using Node, Express, and Nedb

## Shorten URLs

Open the homepage (coming soon!) of the website and you will be presented with a text input. Paste in your URL and click "shorten" and you will be
given a link a shortened link. All shortened links have the form &lt;host&gt;/v/&lt;id&gt; where &lt;id&gt; is a case-sensitive 6 character
alphanumeric-plus-underscore-and-dash URL id.

Simply open the shortened link to be taken to the corresponding webpage

## Todo

*  [ ]  **Add rate limiting**
*  [ ]  **Sanitize URL inputs**
*  [x]  **Change port host string to env variables so it can be deployed**
*  [ ]  **Guard some routes for development behind node_environment**
*  [x]  **Possibly create more IDs for URLs. With the 6 char identifiers there are 68,719,476,736 possible urls that can be kept. Increasing to 2 groups of 4
would allow for 248,155,780,267,521 URLs considering the hypen would be used to separate groups and no longer be valid in the URL ID itself**
*  [ ]  *Clear out old URLs after a while? How long if at all?*
*  [ ]  Add some CSS to make the pages look nicer
