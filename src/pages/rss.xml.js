import rss from '@astrojs/rss'
import sanitizeHtml from 'sanitize-html'
import { getChannelInfo } from '../lib/telegram'
import { getEnv } from '../lib/env'

export const prerender = false

export async function GET(Astro) {
  const request = Astro.request
  const { SITE_URL } = Astro.locals
  const channel = await getChannelInfo(Astro)
  const posts = channel.posts || []

  const url = new URL(request.url)
  url.pathname = SITE_URL

  const homepage = getEnv(import.meta.env, Astro, 'HOMEPAGE')
  const origin = getEnv(import.meta.env, Astro, 'ORIGINURL')
  const fmtURL = (str) => {
    return str
      .replace(new RegExp(origin, 'gi'), `https://${homepage}/posts`)
      .replace(/href="n.simp.red/gi, `href="https://${homepage}`)
      // .replace(/img src="/gi, `img src="https://${homepage}/static/`)
  }

  return rss({
    title: channel.title,
    description: channel.description,
    site: url.origin,
    items: posts.map(item => ({
      link: `posts/${item.id}`,
      title: item.title,
      description: item.description,
      pubDate: new Date(item.datetime),
      content: sanitizeHtml(fmtURL(item.rss_content), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'video', 'audio']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          video: ['src', 'width', 'height', 'poster'],
          audio: ['src', 'controls'],
          img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'class'],
        },
        exclusiveFilter(frame) {
          return frame.tag === 'img' && frame.attribs?.class?.includes('modal-img')
        },
      }),
    })),
  })
}
