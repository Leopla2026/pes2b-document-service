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

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

exports.extractBatch = async (req, res) => {

    try {

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Nenhum arquivo enviado."
            });
        }

        const documents = [];

        for (const file of req.files) {

            try {

                const result = await engine.process(file.buffer);

                documents.push({
                    filename: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    ...result
                });

            } catch (err) {

                documents.push({
                    filename: file.originalname,
                    success: false,
                    message: err.message
                });

            }

        }

        return res.json({
            success: true,
            totalFiles: req.files.length,
            documents
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};