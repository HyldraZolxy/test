/**
 * Real BeatLeader scores (accuracy, modifiers, server PP) with the ratings of their map,
 * fetched from api.beatleader.xyz. Used to check the PP port against the server.
 */
import type { BeatLeaderMapInfo } from "../types";

export interface BeatLeaderScoreFixture {
    modifiers: string;
    accuracy: number;
    pp: number;
    map: BeatLeaderMapInfo;
}

export const BEATLEADER_SCORES: BeatLeaderScoreFixture[] = [
    {
        "modifiers": "",
        "accuracy": 0.97970355,
        "pp": 578.17035,
        "map": {
            "stars": 0,
            "passRating": 4.3924103,
            "accRating": 8.820989,
            "techRating": 7.919922,
            "modifierValues": {
                "da": 0,
                "fs": 0.4,
                "sf": 0.72,
                "ss": -0.3,
                "gn": 0,
                "na": -0.3,
                "nb": -0.2,
                "nf": -1,
                "no": -0.2,
                "pm": 0,
                "sc": -0.5,
                "sa": 0,
                "op": -0.5
            },
            "speedRatings": {
                "fs": {
                    "passRating": 5.565385,
                    "accRating": 9.588498,
                    "techRating": 8.683164
                },
                "sf": {
                    "passRating": 7.531175,
                    "accRating": 10.504779,
                    "techRating": 9.729781
                },
                "ss": {
                    "passRating": 3.5183697,
                    "accRating": 8.131052,
                    "techRating": 7.119687
                }
            }
        }
    },
    {
        "modifiers": "SF",
        "accuracy": 0.9541574,
        "pp": 504.75586,
        "map": {
            "stars": 0,
            "passRating": 4.3924103,
            "accRating": 8.820989,
            "techRating": 7.919922,
            "modifierValues": {
                "da": 0,
                "fs": 0.4,
                "sf": 0.72,
                "ss": -0.3,
                "gn": 0,
                "na": -0.3,
                "nb": -0.2,
                "nf": -1,
                "no": -0.2,
                "pm": 0,
                "sc": -0.5,
                "sa": 0,
                "op": -0.5
            },
            "speedRatings": {
                "fs": {
                    "passRating": 5.565385,
                    "accRating": 9.588498,
                    "techRating": 8.683164
                },
                "sf": {
                    "passRating": 7.531175,
                    "accRating": 10.504779,
                    "techRating": 9.729781
                },
                "ss": {
                    "passRating": 3.5183697,
                    "accRating": 8.131052,
                    "techRating": 7.119687
                }
            }
        }
    },
    {
        "modifiers": "FS",
        "accuracy": 0.9529343,
        "pp": 420.61194,
        "map": {
            "stars": 0,
            "passRating": 4.3924103,
            "accRating": 8.820989,
            "techRating": 7.919922,
            "modifierValues": {
                "da": 0,
                "fs": 0.4,
                "sf": 0.72,
                "ss": -0.3,
                "gn": 0,
                "na": -0.3,
                "nb": -0.2,
                "nf": -1,
                "no": -0.2,
                "pm": 0,
                "sc": -0.5,
                "sa": 0,
                "op": -0.5
            },
            "speedRatings": {
                "fs": {
                    "passRating": 5.565385,
                    "accRating": 9.588498,
                    "techRating": 8.683164
                },
                "sf": {
                    "passRating": 7.531175,
                    "accRating": 10.504779,
                    "techRating": 9.729781
                },
                "ss": {
                    "passRating": 3.5183697,
                    "accRating": 8.131052,
                    "techRating": 7.119687
                }
            }
        }
    },
    {
        "modifiers": "DA",
        "accuracy": 0.95821124,
        "pp": 383.667,
        "map": {
            "stars": 0,
            "passRating": 4.3924103,
            "accRating": 8.820989,
            "techRating": 7.919922,
            "modifierValues": {
                "da": 0,
                "fs": 0.4,
                "sf": 0.72,
                "ss": -0.3,
                "gn": 0,
                "na": -0.3,
                "nb": -0.2,
                "nf": -1,
                "no": -0.2,
                "pm": 0,
                "sc": -0.5,
                "sa": 0,
                "op": -0.5
            },
            "speedRatings": {
                "fs": {
                    "passRating": 5.565385,
                    "accRating": 9.588498,
                    "techRating": 8.683164
                },
                "sf": {
                    "passRating": 7.531175,
                    "accRating": 10.504779,
                    "techRating": 9.729781
                },
                "ss": {
                    "passRating": 3.5183697,
                    "accRating": 8.131052,
                    "techRating": 7.119687
                }
            }
        }
    },
    {
        "modifiers": "GN",
        "accuracy": 0.95919275,
        "pp": 413.13782,
        "map": {
            "stars": 0,
            "passRating": 4.4245324,
            "accRating": 9.796944,
            "techRating": 5.7657204,
            "modifierValues": {
                "da": 0,
                "fs": 0.4,
                "sf": 0.72,
                "ss": -0.3,
                "gn": 0,
                "na": -0.3,
                "nb": -0.2,
                "nf": -1,
                "no": -0.2,
                "pm": 0,
                "sc": -0.5,
                "sa": 0,
                "op": -0.5
            },
            "speedRatings": {
                "fs": {
                    "passRating": 5.59863,
                    "accRating": 10.552577,
                    "techRating": 6.314076
                },
                "sf": {
                    "passRating": 7.6742387,
                    "accRating": 11.428306,
                    "techRating": 7.1927114
                },
                "ss": {
                    "passRating": 3.5488873,
                    "accRating": 9.081556,
                    "techRating": 5.1900177
                }
            }
        }
    },
    {
        "modifiers": "SS",
        "accuracy": 0.95339936,
        "pp": 343.7559,
        "map": {
            "stars": 0,
            "passRating": 4.4245324,
            "accRating": 9.796944,
            "techRating": 5.7657204,
            "modifierValues": {
                "da": 0,
                "fs": 0.4,
                "sf": 0.72,
                "ss": -0.3,
                "gn": 0,
                "na": -0.3,
                "nb": -0.2,
                "nf": -1,
                "no": -0.2,
                "pm": 0,
                "sc": -0.5,
                "sa": 0,
                "op": -0.5
            },
            "speedRatings": {
                "fs": {
                    "passRating": 5.59863,
                    "accRating": 10.552577,
                    "techRating": 6.314076
                },
                "sf": {
                    "passRating": 7.6742387,
                    "accRating": 11.428306,
                    "techRating": 7.1927114
                },
                "ss": {
                    "passRating": 3.5488873,
                    "accRating": 9.081556,
                    "techRating": 5.1900177
                }
            }
        }
    }
];
