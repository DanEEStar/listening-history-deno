import json
import sys
from datetime import datetime, timezone

import requests
from colorama import Fore, Style
from dateutil.parser import isoparse

main_url = 'https://listening-history-deno.deno.dev'


def main():
    result = 0

    response = requests.get(f'{main_url}/update')
    if response.status_code != 200:
        print(Fore.RED + f'update Spotify history failed')
        result += 1
    elif not response.json()['trackInfo']['apiTrackId']:
        print(Fore.RED + f'could not load Spotify track id')
        result += 1
    else:
        print(Fore.GREEN + f'update Spotify history ok')
    print(Style.RESET_ALL)

    response = requests.get(f'{main_url}/updatepocketcasts')
    if response.status_code != 200:
        print(Fore.RED + f'update PocketCasts history failed')
        result += 1
    elif not response.json()['newestEpisode']['uuid']:
        print(Fore.RED + f'could not get PocketCasts episode uuid')
        result += 1
    else:
        print(Fore.GREEN + f'update PocketCasts history ok')
    print(Style.RESET_ALL)

    result += check_status()

    if result > 0:
        sys.exit(result)

    print(Fore.GREEN + 'all ok')


def check_status():
    result = 0

    response = requests.get(f'{main_url}/status')
    status_json = json.loads(response.text)
    print(json.dumps(status_json, indent=2))

    utc_now = datetime.now(timezone.utc)

    jobs = [
        ('update-spotify-history', 60 * 15),
        ('update-pocket-casts-history', 60 * 15),
        ('purge-old-logs', 60 * 60 * 25),
    ]

    for job in jobs:
        end_time = isoparse(status_json['jobStatus'][job[0]]['end_time'])
        diff_seconds = (utc_now - end_time).total_seconds()
        if diff_seconds > job[1]:
            print(Fore.RED + f'{job[0]} failed, last run {end_time}')
            result += 1
        else:
            print(Fore.GREEN + f'{job[0]} ok, last run {end_time}')
    print(Style.RESET_ALL)

    if status_json['numJobEntries'] <= 0 or status_json['numJobEntries'] > 30000:
        print(Fore.RED + f'numJobEntries not ok {status_json["numJobEntries"]}')
        result += 1
    else:
        print(Fore.GREEN + f'numJobEntries ok {status_json["numJobEntries"]}')

    return result


if __name__ == '__main__':
    main()
