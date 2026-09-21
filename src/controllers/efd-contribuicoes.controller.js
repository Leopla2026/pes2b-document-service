const path = require('node:path');
const { errorResponse } = require('../utils/api.response');
const parser = require('../document/parsers/federal/efd-contribuicoes-auxiliary.parser');

exports.parseAuxiliary = (req, res) => {
  if (!req.file) {
    return res.status(400).json(errorResponse({
      message: 'Nenhum arquivo enviado.',
      requestId: req.requestId,
      code: 'FILE_REQUIRED',
      detail: 'Envie um arquivo .txt ou .REC no campo multipart file.',
      field: 'file'
    }));
  }

  const extension = path.extname(req.file.originalname || '').toLowerCase();

  try {
    if (extension === '.txt') return res.json(parser.parseTxt(req.file.buffer));
    if (extension === '.rec') return res.json(parser.parseRec(req.file.buffer));

    return res.status(400).json(errorResponse({
      message: 'Formato de arquivo não suportado.',
      requestId: req.requestId,
      code: 'UNSUPPORTED_FILE_TYPE',
      detail: 'Envie somente arquivos .txt ou .REC.',
      field: 'file'
    }));
  } catch (error) {
    return res.status(422).json(errorResponse({
      message: 'Arquivo auxiliar EFD-Contribuições inválido.',
      requestId: req.requestId,
      code: 'INVALID_EFD_AUXILIARY_FILE',
      detail: error.message,
      field: 'file'
    }));
  }
};
