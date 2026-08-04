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

    let parsed;
    try {
      parsed = new URL(streamUrl);
    } catch {
      return new Response("Invalid streamUrl", {
        status: 500
      });
    }

    // Detect origin and base path
    const origin = parsed.origin;
    const base = streamUrl.substring(
      0,
      streamUrl.lastIndexOf("/") + 1
    );

    // Preserve the original playlist filename
    const fileName = parsed.pathname.split("/").pop();

    // Preserve all existing query parameters
    const query = parsed.search ? parsed.search : "";

    // Build the playlist URL dynamically
    const playlistUrl = `${base}${fileName}${query}`;

    const playlist =
`#EXTM3U
#EXT-X-STREAM-INF:AVERAGE-BANDWIDTH=3840000,BANDWIDTH=4810000,RESOLUTION=1280x720,FRAME-RATE=29.970,CODECS="avc1.640028,mp4a.40.2",CLOSED-CAPTIONS=NONE
${playlistUrl}`;

    return new Response(playlist, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
