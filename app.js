const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const circulationRepo = require('./repos/circulationRepo');
const data = require('./circulation.json');

const url = 'mongodb://localhost:27017';
const dbName = 'circulation';

async function main () {
    const client = new MongoClient(url);
    try {
        await client.connect();

        const results = await circulationRepo.loadData(data);
        assert.equal(data.length, results.insertedCount);

        const getData = await circulationRepo.get();
        assert.equal(data.length, results.insertedCount);

        const filterData = await circulationRepo.get({ Newspaper: getData[4].Newspaper });
        assert.deepEqual(filterData[0], getData[4]);

        const limitData = await circulationRepo.get({}, 3);
        assert.equal(limitData.length, 3);

        const byId = await circulationRepo.getById(getData[4]._id);
        assert.deepEqual(byId, getData[4]);

        const newItem = {
            "Newspaper": "CRPaper",
            "Daily Circulation, 2004": 1000,
            "Daily Circulation, 2013": 800,
            "Change in Daily Circulation, 2004-2013": 10,
            "Pulitzer Prize Winners and Finalists, 1990-2003": 2,
            "Pulitzer Prize Winners and Finalists, 2004-2014": 1,
            "Pulitzer Prize Winners and Finalists, 1990-2014": 3
        };
        const addedItem = await circulationRepo.add(newItem);
        const addedItemQuery = await circulationRepo.getById(addedItem.insertedId);
        assert.deepEqual(newItem, addedItemQuery);

        const toUpdateItem = {
            "Newspaper": "New CRPaper",
            "Daily Circulation, 2004": 1000,
            "Daily Circulation, 2013": 800,
            "Change in Daily Circulation, 2004-2013": 10,
            "Pulitzer Prize Winners and Finalists, 1990-2003": 2,
            "Pulitzer Prize Winners and Finalists, 2004-2014": 1,
            "Pulitzer Prize Winners and Finalists, 1990-2014": 3
        };
        const updateItem = await circulationRepo.update(addedItem.insertedId, toUpdateItem);
        const updatedItemQuery = await circulationRepo.getById(addedItem.insertedId);
        assert.equal(updatedItemQuery.Newspaper, "New CRPaper");

        const removed = await circulationRepo.remove(addedItem.insertedId);
        assert(removed);
        const deletedItem = await circulationRepo.getById(addedItem.insertedId);
        assert.equal(deletedItem, null);

        const avgFinalists = await circulationRepo.averageFinalists();
        console.log('avgFinalists', avgFinalists);

        const avgByChange = await circulationRepo.averageFinalistsByChange();
        console.log('avgByChange', avgByChange);

    } catch (err) {
        console.error(err);
    } finally {
        await client.db(dbName).dropDatabase();
        const admin = client.db(dbName).admin();
        // console.log('Databases: ', await admin.listDatabases());
        await client.close();
    }
}

main();