module.exports = async (payload, slug, filename) => {
    const files = await payload.find({
        collection: slug,
        limit: 1,
        depth: 1,
        where: { filename: { equals: filename } },
    });
    return files.totalDocs > 0;
};
