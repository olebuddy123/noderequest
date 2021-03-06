// requires 
var url = require('url'),
    http = require('http'),
    path = require('path'),
    fs = require('fs')

// constants and lists    

//these are the only file mimetypes supported
extensions = {
    ".ico": "image/x-icon",
    ".css": "text/css",
    ".js": "application/javascript",
    ".png": "image/png",
    ".gif": "image/gif",
    ".jpg": "image/jpeg"
};

statusCodes = {
    "400": "Bad Request",
    "401": "Unauthorized",
    "402": "Payment Required",
    "403": "Forbidden",
    "404": "Not Found",
    "405": "Method Not Allowed",
    "406": "Not Acceptable",
    "407": "Proxy Authentication Required",
    "408": "Request Timeout",
    "409": "Conflict",
    "410": "Gone",
    "411": "Length Required",
    "412": "Precondition Failed",
    "413": "Request Entity Too Large",
    "414": "Request-URI Too Long",
    "415": "Unsupported Media Type",
    "416": "Requested Range Not Satisfiable",
    "417": "Expectation Failed",
    "418": "I'm a teapot",
    "422": "Unprocessable Entity",
    "423": "Locked",
    "424": "Failed Dependency",
    "425": "Unordered Collection",
    "426": "Upgrade Required",
    "428": "Precondition Required",
    "429": "Too Many Requests",
    "431": "Request Header Fields Too Large",
    "500": "Internal Server Error",
    "501": "Not Implemented",
    "502": "Bad Gateway",
    "503": "Service Unavailable",
    "504": "Gateway Timeout",
    "505": "HTTP Version Not Supported",
    "506": "Variant Also Negotiates",
    "507": "Insufficient Storage",
    "508": "Loop Detected",
    "510": "Not Extended",
    "511": "Network Authentication Required"
};


// common functions


var queryString = function (request) {
    //Process querystring parameters
    //example here is to use for prefilling the form
    var url_parts = url.parse(request.url, true);
    return url_parts.query;
}

/**
 * Use Error.create(msg [, data [, inner]]) to create Error instances.
 * function create
 * @param msg (string)
 * @param data (any type) adds metadata to the Error instance
 * @param inner (any type) for chaining errors
 * @api public
 */
Error.create = function (msg, data, inner) {

    data = data || {};

    var err = new Error(msg || "Unknown error");

    var innerValue = inner || (data instanceof Error ? data : null);
    if (innerValue) err.inner = innerValue;

    if (data instanceof Array || typeof (data) !== 'object') {

        err.data = data;

    } else {

        Object.keys(data).forEach(function (key) {
            err[key] = data[key];
        });
    }

    return err;
};

/**
 * Use Error.http([code] [, msg [, data [, inner]]]) to create Error instances with status codes.
 * @param code (numeric) adds status property to the error.
 * @param msg (string)
 * @param data (any type) adds metadata to the Error instance
 * @param inner (Error|string) for chaining errors
 */
Error.http = function (code, msg, data, inner) {
    code = code || 500;
    msg = msg || statusCodes["" + code] || 'Unknown error';

    var err = Error.create(msg, data, inner);
    err.status = code;
    return err;
};

/**
 * Turn an Error instance into a json object recursively. Use this function
 * for printing the entire error (even the stacks).
 * @param err (Error|Object)
 * @api public
 */
Error.toJson = function (err) {

    if (typeof (err) === 'string') return {
        message: err
    };

    var info = {};
    if (err instanceof Error) {
        info.message = err.message;
        info.stack = err.stack.split("\n");
    }

    if (typeof (err) === 'object') {
        for (var prop in err) {
            var value = err[prop];
            info[prop] = (value instanceof Error) ? Error.toJson(value) : value;
        }
    }

    return info;
};




function isMimeType(ext) {
    var m = extensions[ext];

    if (typeof m != 'undefined') {
        return true;
    }

    return false;
}


//helper function handles file processing
function getFile(req, res) {
    var pathname = url.parse(req.url).pathname,
        fileName = path.basename(req.url) || 'index.js',
        ext = path.extname(fileName),
        localFolder = __dirname + '/' + ext.replace('.', '') + '/';

    var filePath = rootpath + req.url;
    var mimeType = extensions[ext];

    //console.log("filePath: " + filePath);

    //does the requested file exist?
    fs.exists(filePath, function (exists) {
        //if it does...
        if (exists) {
            //read the file, run the anonymous function
            fs.readFile(filePath, function (err, contents) {
                if (!err) {
                    //if there was no error
                    //send the contents with the default 200/ok header
                    res.writeHead(200, {
                        "Content-type": mimeType,
                        "Content-Length": contents.length,
                        "Cache-control": 'public, max-age=31536000'
                    });
                    res.end(contents);
                } else {
                    //for our own troubleshooting
                    console.dir(err);
                };
            });
        } else {
            //if the requested file was not found
            //serve-up our custom 404 page
            res.writeHead(404, {
                'Content-Type': 'text/html'
            });
            res.end();
        };
    });
};


// Export functions
exports.queryString = queryString;
exports.getFile = getFile;
exports.isMimeType = isMimeType;