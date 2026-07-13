exports.buildResponse = ({
    documentType,
    parser,
    pages,
    data,
    text
}) => {

    const warnings = [];

    if (!data?.identificacao?.cnpj) {
        warnings.push("CNPJ não encontrado.");
    }

    if (!data?.identificacao?.competencia) {
        warnings.push("Competência não encontrada.");
    }

    return {

        success: true,

        engine: {

            version: "1.2.0",

            parser,

            confidence: warnings.length === 0 ? 1 : 0.90

        },

        documentType,

        pages,

        data,

        warnings,

        errors: [],

        text

    };

};