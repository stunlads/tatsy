const { returnJSON, returnSuccess, returnFail } = require('./utils/returns');
const { apiUrl } = require('./utils/shortcuts');

module.exports = (name, options) => {
  const {
    schema = {},
    schemaOptions = {},
    transform = (doc, obj) => obj,
    endpoints = {}
  } = options;

  return (url, { Http, Mongo }) => {
    const Model = Mongo.collection(name, schema, transform, schemaOptions);

    // getAll
    Http.get(apiUrl(url), async (req, res) => {
      const handler = endpoints.getAll;

      if (handler) {
        return res.json(await handler.call({
          collections: Mongo.Collections
        }));
      }

      Model.find({ }, (err, list) => {
        return res.json(returnJSON('success', list));
      });
    });

    Http.get(apiUrl(url, '_id'), async (req, res) => {
      const handler = endpoints.get;
      const { _id } = req.params;

      if (handler) {
        return res.json(await handler.call({
          collections: Mongo.Collections,
        }, _id));
      }

      return Model.findOne({ _id }, (err, doc) => {
        if (doc) {
          return res.json(returnSuccess(doc));
        }

        return res.status(404).json(returnFail(name));
      });
    });

    Http.post(apiUrl(url), async (req, res) => {
      const handler = endpoints.post;
      const { body } = req;

      // create model
      const doc = new Model(body);

      if (handler) {
        return res.json(await handler.call({
          collections: Mongo.Collections,
        }, body));
      }

      // save doc
      return doc.save((err, data) => {
        return res.json(returnSuccess(data));
      });
    });

    Http.put(apiUrl(url, '_id'), async (req, res) => {
      const handler = endpoints.put;
      const { _id } = req.params;
      const { body } = req;

      if (handler) {
        return res.json(await handler.call({
          collections: Mongo.Collections
        }, _id, body));
      }

      // update
      Model.findOneAndUpdate({ _id }, body, (err, data) => {
        if (data) {
          return res.json(returnSuccess(data));
        }

        return res.status(404).json(returnFail(_id));
      });
    });

    Http.delete(apiUrl(url, '_id'), async (req, res) => {
      const handler = endpoints.delete;
      const { _id } = req.params;

      if (handler) {
        return res.json(await handler.call({
          collections: Mongo.Collections,
        }, _id));
      }

      // remove
      return Model.findOneAndDelete({ _id }, (err, data) => {
        if (data) {
          return res.json(returnSuccess(data));
        }

        return res.status(404).json(returnFail(_id));
      });
    });
  
    return Model;
  };
};
