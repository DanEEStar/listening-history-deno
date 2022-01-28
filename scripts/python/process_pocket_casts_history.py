import glob
import json


processed_history = []


def process_history_file(history_file):
    with(open(history_file, "r")) as f:
        content = f.read()
        data = json.loads(content)
        # print(data['episodes'][0]["title"])

        for episode in data['episodes']:
            if episode['playingStatus'] == 3 or episode.get('playedUpTo', 0) / (episode.get('duration') or 10000) > 0.7:
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
