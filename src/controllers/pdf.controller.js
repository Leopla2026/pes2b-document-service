const engine = require('../document/engine/document.engine');

exports.extract = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message: "Nenhum arquivo enviado."

            });

        }

        const result = await engine.process(req.file.buffer);

        return res.json(result);

    }

    catch (err) {

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};