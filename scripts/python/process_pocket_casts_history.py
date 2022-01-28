import glob
import json
from datetime import datetime, timedelta

processed_history = []


def process_history_file(history_file):
    with(open(history_file, "r")) as f:
        content = f.read()
        data = json.loads(content)

        dt = datetime.fromisoformat(history_file[32:42]) + timedelta(hours=15)
        print(data['episodes'][0]["title"])

        for episode in data['episodes']:
            if episode['playingStatus'] == 3 or episode.get('playedUpTo', 0) / (episode.get('duration') or 10000) > 0.7:

                if episode['podcastUuid'] == '373e7cc0-bbab-0134-10a8-25324e2a541d':
                    if not episode['podcastTitle']:
                        episode['podcastTitle'] = 'Spieleveteranen'

                    new_dt = datetime.fromisoformat(
                        episode['published'].replace("Z", "+00:00")
                    ).replace(
                        hour=0, minute=0, second=0, microsecond=0
                    ) + timedelta(days=1, hours=15)
                    print('found Spieleveteranen set time to', dt)

                    if new_dt.timestamp() > dt.timestamp():
                        print('date is bigger')
                    dt = new_dt

                if not episode['podcastTitle']:
                    same_podcasts = [p for p in processed_history if p['podcastUuid'] == episode['podcastUuid']]
                    if len(same_podcasts) > 0:
                        episode['podcastTitle'] = same_podcasts[0]['podcastTitle']

                    if episode['podcastUuid'] == 'c19dfea0-4791-0137-f266-1d245fc5f9cf':
                        episode['podcastTitle'] = '13 Minutes to the Moon'

                    if episode['podcastUuid'] == "98a72580-6162-0137-f267-1d245fc5f9cf":
                        episode['podcastTitle'] = 'Pipifax'

                    if episode['podcastUuid'] == "ca2d8bf0-8e0a-0136-7b92-27f978dac4db":
                        episode['podcastTitle'] = 'The REPL'

                episode['playedAt'] = dt.isoformat()[0:19]
                dt = dt - timedelta(days=1)
                p_in_processed = len([p for p in processed_history if p['uuid'] == episode['uuid']])

                if not p_in_processed:
                    processed_history.append(episode)


def main():
    for history_file in sorted(glob.glob("PocketCasts/*.json"), reverse=True):
        print(history_file)
        process_history_file(history_file)

    json.dump(processed_history, open("processed_history.json", "w"), indent=2)


if __name__ == '__main__':
    main()
