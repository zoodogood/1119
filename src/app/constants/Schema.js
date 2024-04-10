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
      addToNewGuildAt: 0,
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
        effects: [
          {
            id: "",
            uid: "",
            createdAt: 0,
            values: {},
          },
        ],
        cheese: 0,
        last_online: 0,
        chestBonus: 0,
        praiseMe: [""],
        BDay: "",
        questsGlobalCompleted: {},
        grempenBoughted: 0,
        shopTime: 0,
        first_$: true,
        praise: [""],
        profile_color: "",
        profile_description: "",
        questLast: "",
        dayQuests: 0,
        thiefGloves: 0,
        thiefCombo: 0,
        thiefWins: 0,
        chilli: 0,
        invites: 0,
        iq: 0,
        cursesEnded: 0,
        element: {},
        coinsPerMessage: 0,
        elementLevel: 0,
        bag: {},
        seed: 0,
        voidCasino: 0,
        voidPrice: 0,
        voidTreeFarm: 0,
        voidDouble: 0,
        voidThief: 0,
        voidMysticClover: 0,
        voidFreedomCurse: 0,
        voidCooldown: 0,
        voidMonster: 0,
        CD_$: 0,
        profile_confidentiality: true,
        voidQuests: {},
        monster: 0,
        monstersBought: 0,
        remainedQuest: {},
        presents: 0,
        lollipops: 0,
        snowyTree: 0,
        effectsCallbackMap: {},
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
      },
      resourcesChanges: {},
      actions: {},
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
 * @property {number} addToNewGuildAt
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
 * @property {effects[]} effects
 * @property {number} cheese
 * @property {number} last_online
 * @property {number} chestBonus
 * @property {string[]} praiseMe
 * @property {string} BDay
 * @property {questsGlobalCompleted} questsGlobalCompleted
 * @property {number} grempenBoughted
 * @property {number} shopTime
 * @property {boolean} first_$
 * @property {string[]} praise
 * @property {string} profile_color
 * @property {string} profile_description
 * @property {string} questLast
 * @property {number} dayQuests
 * @property {number} thiefGloves
 * @property {number} thiefCombo
 * @property {number} thiefWins
 * @property {number} chilli
 * @property {number} invites
 * @property {number} iq
 * @property {number} cursesEnded
 * @property {element} element
 * @property {number} coinsPerMessage
 * @property {number} elementLevel
 * @property {bag} bag
 * @property {number} seed
 * @property {number} voidCasino
 * @property {number} voidPrice
 * @property {number} voidTreeFarm
 * @property {number} voidDouble
 * @property {number} voidThief
 * @property {number} voidMysticClover
 * @property {number} voidFreedomCurse
 * @property {number} voidCooldown
 * @property {number} CD_$
 * @property {boolean} profile_confidentiality
 * @property {voidQuests} voidQuests
 * @property {number} monster
 * @property {number} monstersBought
 * @property {remainedQuest} remainedQuest
 * @property {number} presents
 * @property {number} lollipops
 * @property {number} snowyTree
 * @property {effectsCallbackMap} effectsCallbackMap
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

*/

/**
 * @typedef {object} effects
 * @property {string} id
 * @property {string} uid
 * @property {number} createdAt
 * @property {values} values
 */

/**
* @typedef {object} questsGlobalCompleted

*/

/**
* @typedef {object} element

*/

/**
* @typedef {object} bag

*/

/**
* @typedef {object} voidQuests

*/

/**
* @typedef {object} remainedQuest

*/

/**
* @typedef {object} effectsCallbackMap

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
 * @property {resourcesChanges} resourcesChanges
 * @property {actions} actions
 */

/**
 * @typedef {object} daily
 * @property {}
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

/**
* @typedef {object} actions

*/

export { Schema };
