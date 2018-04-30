import requests
import m3u8
import sys
import re
import os
import subprocess

CHUNK_RE = "(.+\.ts)\?start_offset=(\d+)&end_offset=(\d+)"
CHUNK_RE = "(.+\.ts)\?start_offset=(\d+)&end_offset=(\d+)"
SIMPLE_CHUNK_RE = "(.+\.ts)"
VOD_API = "https://api.twitch.tv/api/vods/{}/access_token"
INDEX_API = "http://usher.twitch.tv/vod/{}"
headers = {'Client-Id': 'dkxbzceldq37fv52ddo25g3z4bxdb3'}

def get_vod_index(vod_id):
    # Get access code
    url = VOD_API.format(vod_id)
    r = requests.get(url, headers=headers)
    data = r.json()


    # Fetch vod index
    url = INDEX_API.format(vod_id)
    payload = {'nauth': data['token'], 'nauthsig': data['sig']}
    r = requests.get(url, params=payload)

    m = m3u8.loads(r.content)
    url = m.playlists[0].uri
    return m3u8.load(url)


def extract_clip(index, start_time, end_time):
    # Get the piece we need
    position = 0
    pieces = []

    for seg in index.segments:
        # Add duration of current segment
        position += seg.duration

        # Check if we have gotten to the start of the clip
        if position < start_time:
            continue

        # Extract clip name and byte range
        print(seg.absolute_uri)
        p = re.match(CHUNK_RE, seg.absolute_uri)
        if not p:
                p = re.match(SIMPLE_CHUNK_RE, seg.absolute_uri)
                filename = p.groups()[0]
                start_byte = 0
                end_byte = 0
        else: 
            filename, start_byte, end_byte = p.groups()

        # If we have a new file, add it to the list
        if not pieces or pieces[-1][0] != filename:
            pieces.append([filename, start_byte, end_byte])
        else: # Else, update the end byte
            pieces[-1][2] = end_byte

        # Check if we have reached the end of clip
        if position > end_time:
            break

    return pieces


if __name__ == '__main__':
    vod_id = sys.argv[1]
    start = int(sys.argv[2])
    end = int(sys.argv[3])

    name = vod_id + '_' + str(start) + '_' + str(end) + '.mp4'

    index = get_vod_index(vod_id)
    pieces = extract_clip(index, start, end)

    with open(os.path.join('.','pieces.txt'), 'w+') as cf:
        for p in pieces:
            video_url = "{}?start_offset={}&end_offset={}".format(*p)
            cf.write('%s\n' % video_url)

    transport_stream_file_name = name
    print(transport_stream_file_name)
    subprocess.call('wget -i %s -nv -O %s' % (os.path.join('.','pieces.txt'), transport_stream_file_name),cwd='.', shell=True)
    subprocess.call('ffmpeg -i %s -bsf:a aac_adtstoasc -c copy %s' % (transport_stream_file_name, name),cwd='.', shell=True)
    # os.remove(os.path.join(app.pargs.output, 'chunks.txt'))
    # os.remove(os.path.join(app.pargs.output, transport_stream_file_name))
    # # Output all the chunks we need
    # for part in pieces:
    #     print "{}?start_offset={}&end_offset={}".format(*part)