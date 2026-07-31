export default {
  async fetch(request) {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response("Missing id parameter", {
        status: 400,
        headers: {
          "Content-Type": "text/plain"
        }
      });
    }

    // Fetch the channel page
    const pageResponse = await fetch(
      `https://m.fawanews.news/?channel=${encodeURIComponent(id)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36"
        }
      }
    );

    if (!pageResponse.ok) {
      return new Response("Unable to retrieve source page", {
        status: 502
      });
    }

    const html = await pageResponse.text();

    // Find streamUrl
    const match = html.match(/streamUrl\s*:\s*['"]([^'"]+)['"]/);

    if (!match) {
      return new Response("streamUrl not found", {
        status: 500
      });
    }

    const streamUrl = match[1];

    const parsed = new URL(streamUrl);
    const token = parsed.searchParams.get("token");

    if (!token) {
      return new Response("Token not found", {
        status: 500
      });
    }

    const playlist =
`#EXTM3U
#EXT-X-STREAM-INF:AVERAGE-BANDWIDTH=3840000,BANDWIDTH=4810000,RESOLUTION=1280x720,FRAME-RATE=29.970,CODECS="avc1.640028,mp4a.40.2",CLOSED-CAPTIONS=NONE
https://cdn.bluetier.top/${id}/tracks-v1a1/mono.m3u8?token=${token}`;

    return new Response(playlist, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
