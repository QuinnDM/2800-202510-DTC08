const Sighting = require("../models/sighting");
const User = require("../models/user");

async function getUserSightingCounts(userId) {
  const birdCount = await Sighting.countDocuments({
    userId: userId,
    taxonomicGroup: "bird"
  });

  const plantCount = await Sighting.countDocuments({
    userId: userId,
    taxonomicGroup: "plant"
  });

  return { birdsSighted: birdCount, plantsSighted: plantCount };
}

async function validateUserStats(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (!user.stats) {
    user.stats = { birds: 0, plants: 0, points: 0 };
  }

  const missingFields = ["birds", "plants", "points"].filter(field => !(field in user.stats));
  for (const field of missingFields) {
    user.stats[field] = 0;
  }

  const { birdsSighted, plantsSighted } = await getUserSightingCounts(userId);

  user.stats.birds = birdsSighted;
  user.stats.plants = plantsSighted;

  await user.save();

  return user.stats;
}

module.exports = {
  getUserSightingCounts,
  validateUserStats
};