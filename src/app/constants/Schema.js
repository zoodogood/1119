/**
 * @type {Schema}
 */
const Schema = {
  DataManager: {
    bot: {
      berrysPrice: 0,
      grempenItems: "",
      commandsUsed: {
        "": 0,
      },
      dayDate: "",
      currentDay: 0,
      commandsLaunched: 0,
      newGuildTimestamp: 0,
      messagesToday: 0,
      commandsUsedToday: 0,
      bossDamageToday: 0,
    },
    guilds: [
      {
        name: "",
        boss: {
          level: 0,
          users: [{}],
        },
      },
    ],
    users: [
      {
        id: "",
        name: "",
        coins: 0,
        level: 0,
        exp: 0,
        berrys: 0,
        chestLevel: 0,
        void: 0,
        keys: 0,
        voidRituals: 0,
        voidCoins: 0,
        quest: {
          id: "",
          goal: 0,
          progress: 0,
          reward: 0,
          day: 0,
          willUpdated: true,
          isCompleted: true,
        },
        curses: [
          {
            id: "",
            values: {
              goal: 0,
              progress: 0,
              timer: 0,
            },
            timestamp: 0,
          },
        ],
        questReward: {},
        questTime: {},
        last_online: 0,
        chestBonus: 0,
        praiseMe: [""],
        BDay: "",
        questsGlobalCompleted: {},
        grempenBoughted: 0,
        shopTime: {},
        first_$: true,
        praise: [""],
        profile_color: {},
        profile_description: {},
        questLast: {},
        dayQuests: {},
        thiefGloves: {},
        chilli: {},
        invites: {},
        iq: 0,
        cursesEnded: 0,
        voidCasino: {},
        element: {},
        coinsPerMessage: 0,
        voidPrice: {},
        elementLevel: 0,
        bag: {},
        seed: 0,
        voidTreeFarm: {},
        voidDouble: {},
        CD_$: 0,
        leave_roles: {},
        profile_confidentiality: {},
        voidQuests: {},
        monster: {},
        monstersBought: {},
        voidThief: {},
        thiefWins: {},
        voidMysticClover: {},
        voidFreedomCurse: {},
        voidCooldown: {},
        remainedQuest: {},
        bossEffects: {},
        bossEffectsCallbackMap: {},
        cursesCallbackMap: {},
      },
    ],
    site: {
      enterToPages: {},
      entersToPages: 0,
      entersToPagesToday: 0,
      enterToAPI: {},
      entersToAPI: 0,
      entersToAPIToday: 0,
    },
    audit: {
      daily: {
        "": {
          enterToPages: 0,
          enterToAPI: 0,
          messages: 0,
          commandsUsed: 0,
          riches: 0,
        },
        resourcesChanges: {},
      },
    },
  },
};

// Generated from https://rafistrauss.github.io/jsdoc-generator/
/**
 * @typedef {object} Schema
 * @property {DataManager} DataManager
 */

/**
 * @typedef {object} DataManager
 * @property {bot} bot
 * @property {guilds[]} guilds
 * @property {users[]} users
 * @property {site} site
 * @property {audit} audit
 */

/**
 * @typedef {object} bot
 * @property {number} berrysPrice
 * @property {string} grempenItems
 * @property {commandsUsed} commandsUsed
 * @property {string} dayDate
 * @property {number} currentDay
 * @property {number} commandsLaunched
 * @property {number} newGuildTimestamp
 * @property {number} messagesToday
 * @property {number} commandsUsedToday
 * @property {number} bossDamageToday
 */

/**
 * @typedef {object} commandsUsed
 * @property {number}
 */

/**
 * @typedef {object} guilds
 * @property {string} name
 * @property {boss} boss
 */

/**
 * @typedef {object} boss
 * @property {number} level
 * @property {users[]} users
 */

/**
 * @typedef {object} users
 * @property {string} id
 * @property {string} name
 * @property {number} coins
 * @property {number} level
 * @property {number} exp
 * @property {number} berrys
 * @property {number} chestLevel
 * @property {number} void
 * @property {number} keys
 * @property {number} voidRituals
 * @property {number} voidCoins
 * @property {quest} quest
 * @property {curses[]} curses
 * @property {questReward} questReward
 * @property {questTime} questTime
 * @property {number} last_online
 * @property {number} chestBonus
 * @property {string[]} praiseMe
 * @property {string} BDay
 * @property {questsGlobalCompleted} questsGlobalCompleted
 * @property {number} grempenBoughted
 * @property {shopTime} shopTime
 * @property {boolean} first_$
 * @property {string[]} praise
 * @property {profile_color} profile_color
 * @property {profile_description} profile_description
 * @property {questLast} questLast
 * @property {dayQuests} dayQuests
 * @property {thiefGloves} thiefGloves
 * @property {chilli} chilli
 * @property {invites} invites
 * @property {number} iq
 * @property {number} cursesEnded
 * @property {voidCasino} voidCasino
 * @property {element} element
 * @property {number} coinsPerMessage
 * @property {voidPrice} voidPrice
 * @property {number} elementLevel
 * @property {bag} bag
 * @property {number} seed
 * @property {voidTreeFarm} voidTreeFarm
 * @property {voidDouble} voidDouble
 * @property {number} CD_$
 * @property {leave_roles} leave_roles
 * @property {profile_confidentiality} profile_confidentiality
 * @property {voidQuests} voidQuests
 * @property {monster} monster
 * @property {monstersBought} monstersBought
 * @property {voidThief} voidThief
 * @property {thiefWins} thiefWins
 * @property {voidMysticClover} voidMysticClover
 * @property {voidFreedomCurse} voidFreedomCurse
 * @property {voidCooldown} voidCooldown
 * @property {remainedQuest} remainedQuest
 * @property {bossEffects} bossEffects
 * @property {bossEffectsCallbackMap} bossEffectsCallbackMap
 * @property {cursesCallbackMap} cursesCallbackMap
 */

/**
 * @typedef {object} quest
 * @property {string} id
 * @property {number} goal
 * @property {number} progress
 * @property {number} reward
 * @property {number} day
 * @property {boolean} willUpdated
 * @property {boolean} isCompleted
 */

/**
 * @typedef {object} curses
 * @property {string} id
 * @property {values} values
 * @property {number} timestamp
 */

/**
 * @typedef {object} values
 * @property {number} goal
 * @property {number} progress
 * @property {number} timer
 */

/**
* @typedef {object} questReward

*/

/**
* @typedef {object} questTime

*/

/**
* @typedef {object} questsGlobalCompleted

*/

/**
* @typedef {object} shopTime

*/

/**
* @typedef {object} profile_color

*/

/**
* @typedef {object} profile_description

*/

/**
* @typedef {object} questLast

*/

/**
* @typedef {object} dayQuests

*/

/**
* @typedef {object} thiefGloves

*/

/**
* @typedef {object} chilli

*/

/**
* @typedef {object} invites

*/

/**
* @typedef {object} voidCasino

*/

/**
* @typedef {object} element

*/

/**
* @typedef {object} voidPrice

*/

/**
* @typedef {object} bag

*/

/**
* @typedef {object} voidTreeFarm

*/

/**
* @typedef {object} voidDouble

*/

/**
* @typedef {object} leave_roles

*/

/**
* @typedef {object} profile_confidentiality

*/

/**
* @typedef {object} voidQuests

*/

/**
* @typedef {object} monster

*/

/**
* @typedef {object} monstersBought

*/

/**
* @typedef {object} voidThief

*/

/**
* @typedef {object} thiefWins

*/

/**
* @typedef {object} voidMysticClover

*/

/**
* @typedef {object} voidFreedomCurse

*/

/**
* @typedef {object} voidCooldown

*/

/**
* @typedef {object} remainedQuest

*/

/**
* @typedef {object} bossEffects

*/

/**
* @typedef {object} bossEffectsCallbackMap

*/

/**
* @typedef {object} cursesCallbackMap

*/

/**
 * @typedef {object} site
 * @property {enterToPages} enterToPages
 * @property {number} entersToPages
 * @property {number} entersToPagesToday
 * @property {enterToAPI} enterToAPI
 * @property {number} entersToAPI
 * @property {number} entersToAPIToday
 */

/**
* @typedef {object} enterToPages

*/

/**
* @typedef {object} enterToAPI

*/

/**
 * @typedef {object} audit
 * @property {daily} daily
 */

/**
 * @typedef {object} daily
 * @property {}
 * @property {resourcesChanges} resourcesChanges
 */

/**
 * @typedef {object}
 * @property {number} enterToPages
 * @property {number} enterToAPI
 * @property {number} messages
 * @property {number} commandsUsed
 * @property {number} riches
 */

/**
* @typedef {object} resourcesChanges

*/

export { Schema };
