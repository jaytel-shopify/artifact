--
-- PostgreSQL database dump
--

\restrict nghl6gzySuLfm9EWTus3CXkBt1Zb10eoWrkMoql5ivyCaq73YA8XpX1qanChMvY

-- Dumped from database version 14.19
-- Dumped by pg_dump version 14.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: lower_array(text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.lower_array(arr text[]) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    RETURN ARRAY(SELECT LOWER(elem) FROM unnest(arr) AS elem);
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Comment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Comment" (
    id text NOT NULL,
    "postId" text NOT NULL,
    "authorId" text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    mentions jsonb DEFAULT '[]'::jsonb NOT NULL,
    tags text[]
);


--
-- Name: Media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Media" (
    id text NOT NULL,
    filename text NOT NULL,
    "contentType" text NOT NULL,
    "postId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PinnedTag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PinnedTag" (
    id text NOT NULL,
    tag text NOT NULL
);


--
-- Name: Post; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Post" (
    id text NOT NULL,
    "authorId" text NOT NULL,
    title text,
    description text,
    tags text[],
    reactions jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    mentions jsonb DEFAULT '[]'::jsonb NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "displayName" text NOT NULL,
    "photoUrl" text,
    username text NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Comment" (id, "postId", "authorId", content, "createdAt", mentions, tags) FROM stdin;
cm7oyi7qi0001s60htzs1bjf0	cm7o0acjl0001s60h0u4i93eg	cm6thw30g0008s60hkrj1wnge	hello	2025-02-28 15:57:11.466	[]	\N
cm7ozhrv00001s60himn7st75	cm7o0acjl0001s60h0u4i93eg	cm71zq1uu0000s60hsrg9iv1g	hi	2025-02-28 16:24:50.509	[]	\N
cm7p0olmi0001s60hon4v2dlk	cm7o0acjl0001s60h0u4i93eg	cm6tg1zs80000s60hwx5c44p8	Looks great @"Katarina Batina"	2025-02-28 16:58:08.634	[{"userId": "cm6thw30g0008s60hkrj1wnge", "username": "katarina.batina", "displayName": "Katarina Batina"}]	\N
cm7toh1ta000ds60hanroi3ky	cm7tkj5x00001s60hw0u7mjmg	cm6tofeoq0000s60htca0gvcm	Yes	2025-03-03 23:15:11.854	[]	{}
cm7uyn8t5000qs60hlcaqvblv	cm7uyexk9000ns60heh3q29i5	cm6zewlv30000s60hiwupvnso	#msb	2025-03-04 20:47:43.193	[]	{msb}
cm7uynl0q000ss60hjv1hn1r6	cm7uyb2z0000ks60hmdec8d3r	cm6zewlv30000s60hiwupvnso	#msb	2025-03-04 20:47:59.019	[]	{msb}
cm7uynsun000us60h3te47uw3	cm7uyak1n000hs60hs1bjsz6z	cm6zewlv30000s60hiwupvnso	#msb	2025-03-04 20:48:09.167	[]	{msb}
cm7uyo7wm000ws60hjooqux0p	cm7uxr4fn000ds60h52jkajem	cm6zewlv30000s60hiwupvnso	#msb	2025-03-04 20:48:28.678	[]	{msb}
cm7uyohca000ys60hzi6lwp7a	cm7uxlkh6000as60hmjf7xn1r	cm6zewlv30000s60hiwupvnso	#msb	2025-03-04 20:48:40.906	[]	{msb}
cm7uyoqg20010s60hd0u95qg9	cm7uxh7mr0007s60hyf22h24l	cm6zewlv30000s60hiwupvnso	#msb	2025-03-04 20:48:52.707	[]	{msb}
cm7uyw68h0012s60hdl2gd4fr	cm7uwz9w10001s60hh2vp7h4w	cm6thw30g0008s60hkrj1wnge	#shop	2025-03-04 20:54:39.761	[]	{shop}
cm7uzp4b30001s60hpevjc3yp	cm7uviiwu000js60hgzwq30bq	cm6zewlv30000s60hiwupvnso	The tile scroll in the modal page behaves so well. Origami?	2025-03-04 21:17:10.286	[]	{}
cm7vepcuj0001s60hrsc1k98u	cm7uu1a8j0012s60hj6syajw8	cm6thw30g0008s60hkrj1wnge	#admin	2025-03-05 04:17:15.595	[]	{admin}
cm7veq8qq0007s60h1lviflrp	cm7utlp61000ys60hfc4jw1r3	cm6thw30g0008s60hkrj1wnge	#admin	2025-03-05 04:17:56.931	[]	{admin}
cm7ves5ny0009s60hjjz16hqa	cm7uvdjbt0004s60hsee3h5k9	cm6thw30g0008s60hkrj1wnge	Don't forget your tag! #shop	2025-03-05 04:19:26.254	[]	{shop}
cm7vetpk3000bs60hb54adtpm	cm7uthmme000vs60hrgjgzexn	cm6thw30g0008s60hkrj1wnge	#Storefront	2025-03-05 04:20:38.692	[]	{Storefront}
cm7vetyue000ds60htx6et1it	cm7usao9p000as60h4kx0w6qt	cm6thw30g0008s60hkrj1wnge	#Storefront	2025-03-05 04:20:50.726	[]	{Storefront}
cm7veu446000fs60hn1mwhedy	cm7us8yra0001s60hlb2u1hje	cm6thw30g0008s60hkrj1wnge	#Storefront	2025-03-05 04:20:57.558	[]	{Storefront}
cm7veub4k000hs60hnwkq6vs9	cm7utcdwt000ps60h60t2xytj	cm6thw30g0008s60hkrj1wnge	#Storefront	2025-03-05 04:21:06.644	[]	{Storefront}
cm7veuhkh000js60hq8rqkca4	cm7utf7lz000ss60hble5gyvi	cm6thw30g0008s60hkrj1wnge	#Storefront	2025-03-05 04:21:14.993	[]	{Storefront}
cm7veupft000ls60huoprgqfw	cm7uouiha0001s60hlbtag2ni	cm6thw30g0008s60hkrj1wnge	#admin	2025-03-05 04:21:25.194	[]	{admin}
cm7vexdup000ss60heorf5ats	cm7uthmme000vs60hrgjgzexn	cm6thw30g0008s60hkrj1wnge	#storefront	2025-03-05 04:23:30.145	[]	{storefront}
cm7veyblw000us60hoqvkmbmr	cm7us8yra0001s60hlb2u1hje	cm6thw30g0008s60hkrj1wnge	#storefront	2025-03-05 04:24:13.893	[]	{storefront}
cm7veyfy0000ws60h5lz5vfwj	cm7usao9p000as60h4kx0w6qt	cm6thw30g0008s60hkrj1wnge	#storefront	2025-03-05 04:24:19.512	[]	{storefront}
cm7veyl19000ys60h1wof8v3d	cm7ukffwb0004s60hoykm17h1	cm6thw30g0008s60hkrj1wnge	#shop	2025-03-05 04:24:26.109	[]	{shop}
cm7veypzl0010s60hd2d05jkj	cm7utf7lz000ss60hble5gyvi	cm6thw30g0008s60hkrj1wnge	#storefront	2025-03-05 04:24:32.53	[]	{storefront}
cm7veyuyl0012s60hh9hy3z7b	cm7utcdwt000ps60h60t2xytj	cm6thw30g0008s60hkrj1wnge	#storefront	2025-03-05 04:24:38.973	[]	{storefront}
cm7vez05g0014s60h774dlcch	cm7ul9fng0001s60hvttd8ctz	cm6thw30g0008s60hkrj1wnge	#admin	2025-03-05 04:24:45.701	[]	{admin}
cm7vez6p80016s60h2mw369av	cm7uodej30004s60hgphhth8l	cm6thw30g0008s60hkrj1wnge	#admin	2025-03-05 04:24:54.189	[]	{admin}
cm7vezdqr0018s60h3rmgbl55	cm7ukgy530007s60h5zfwfqbq	cm6thw30g0008s60hkrj1wnge	#shop	2025-03-05 04:25:03.315	[]	{shop}
cm7vezvr9001as60hxwt2e4dd	cm7tkj5x00001s60hw0u7mjmg	cm6thw30g0008s60hkrj1wnge	#retail	2025-03-05 04:25:26.661	[]	{retail}
cm7vzetmw0001s60h6356pfst	cm7v1yy0h0001s60hzorcxbo0	cm7uu06ge0010s60hmocr9lu5	#shop #mini	2025-03-05 13:56:56.071	[]	{shop,mini}
cm7w1ljb80004s60hhzyqsok8	cm7vu64d70001s60hq66p7i9k	cm71zq1uu0000s60hsrg9iv1g	Android phone... iOS keyboard... 🙃	2025-03-05 14:58:08.516	[]	{}
cm7w1oqgp0006s60hojy0s1gi	cm7v1yy0h0001s60hzorcxbo0	cm6zewlv30000s60hiwupvnso	Is it just me, or is everyone's head like 5-10% too big?	2025-03-05 15:00:37.754	[]	{}
cm7w5c5q70009s60h2xac2zsh	cm7v1yy0h0001s60hzorcxbo0	cm7w5b1un0007s60hy1nce386	I say we lean into it and just go with bighead versions of everyone	2025-03-05 16:42:49.471	[]	{}
cm7w6u4k1000gs60h5o0um2az	cm7w6s471000ds60hhteycpba	cm7ny5spo0000s60hqabmc2ws	#themestore	2025-03-05 17:24:47.377	[]	{themestore}
cm7wa9yq40004s60hki2zlvri	cm7w6s471000ds60hhteycpba	cm7w8g3650000s60h5rzvmqcw	Excited for this one!!	2025-03-05 19:01:05.164	[]	{}
cm7wajvn8000as60hwheeobr6	cm7w6s471000ds60hhteycpba	cm7w6ijj1000as60hsdoavuck	Yeeeeh this is gonna be dope. 	2025-03-05 19:08:47.732	[]	{}
cm7wjkho0000ws60hziozykqc	cm7wjiknm000ts60hodvu94qr	cm7wayd3g000bs60htgdbt3mm	#admin	2025-03-05 23:21:12.817	[]	{admin}
cm7wkiktk000ys60het8qdsqg	cm7uvcikp0001s60hoa3su9eh	cm6thw30g0008s60hkrj1wnge	#collabs	2025-03-05 23:47:43.209	[]	{collabs}
cm7xmlpn30002s60hfb6h8a7c	cm7wa8dvu0001s60hnmjdvf2v	cm7uzjhwo0001s60ht1tuhtfi	🤯	2025-03-06 17:33:54.831	[]	{}
cm7xmm8vn0004s60hauanmrn0	cm7whtol2000as60halg7wpm9	cm7uzjhwo0001s60ht1tuhtfi	so cool	2025-03-06 17:34:19.764	[]	{}
cm7xw7t240008s60hxrko6vc7	cm7xvb8s10001s60hqqjdckj2	cm7lyry250000s60hl4e0yfts	#shop	2025-03-06 22:03:02.236	[]	{shop}
cm7z97dhk0006s60ht0rk4sa9	cm7z5dzk80001s60hauwe8nfn	cm7uu06ge0010s60hmocr9lu5	goofy	2025-03-07 20:54:23.24	[]	{}
cm8395waq000ds60h0ot9ekvu	cm8393uj3000as60h2e9ykmd3	cm838k8c90004s60hgmf319ly	#admin	2025-03-10 16:04:19.01	[]	{admin}
cm839678x000fs60hdmi2m3nl	cm838xuhs0007s60hv0f03s5x	cm838k8c90004s60hgmf319ly	#admin	2025-03-10 16:04:33.202	[]	{admin}
cm83ik5bq0001s60hwka0wck2	cm7zdts4q000ds60hdjbaeuci	cm7lyry250000s60hl4e0yfts	#shop	2025-03-10 20:27:20.438	[]	{shop}
cm83ikawb0003s60h0sada1gz	cm7zdos4i000as60hoqj2csxx	cm7lyry250000s60hl4e0yfts	#shop	2025-03-10 20:27:27.659	[]	{shop}
cm83ikghm0005s60hse03reco	cm7zdmh0x0007s60hlydi70bn	cm7lyry250000s60hl4e0yfts	#shop	2025-03-10 20:27:34.906	[]	{shop}
cm83ikqoi0007s60h024o5d87	cm7z871iw0001s60hnn5oaf9z	cm7lyry250000s60hl4e0yfts	#shop	2025-03-10 20:27:48.115	[]	{shop}
cm83il1qp0009s60hv8ydgqtz	cm7whtol2000as60halg7wpm9	cm7lyry250000s60hl4e0yfts	#shop	2025-03-10 20:28:02.449	[]	{shop}
cm8eo26o00033s60hv0f46xnf	cm8ejj5ki0013s60hd8277ucs	cm8eo1etv0030s60hwtdzr22r	This was so sick to work on!	2025-03-18 15:46:48	[]	{}
cm8eoepd6003bs60hnaoe27r0	cm86b4oy00001s60h7n783nwj	cm8eo86ln0039s60hifbofb7z	soooo fun!	2025-03-18 15:56:32.106	[]	{}
cm8ep82o2003ms60hgiywrccn	cm86b4oy00001s60h7n783nwj	cm8eozabi003hs60hwv83es2p	I NEED this. Is this live?!	2025-03-18 16:19:22.37	[]	{}
cm8es4rel000ss60himingkj6	cm8es3p6n000ls60hkl9ywy5l	cm71zq1uu0000s60hsrg9iv1g	@owen.dodd has made this way cooler since I last worked on it	2025-03-18 17:40:46.654	[]	{}
cm8ey7rnt003vs60h06vzrs94	cm8es55kl000us60h3lr62k6s	cm6thw30g0008s60hkrj1wnge	#shop	2025-03-18 20:31:04.65	[]	{shop}
cm8fykcso0006s60ha33eeoyj	cm8f1qlar004as60hueo20tcs	cm7uu06ge0010s60hmocr9lu5	Lovely! we need more of this delight in the app! I wonder if we could make the "swipe to unbox" interaction feel more like its ripping this thing open... 🤔	2025-03-19 13:28:38.088	[]	{}
cm8g3e864000ps60ha1q3067e	cm8es254f000fs60h0hweva52	cm7nx40e20005s60hqluumzai	#shop	2025-03-19 15:43:50.236	[]	{shop}
cm8gel9se000ds60h4wsw25gn	cm8f1qlar004as60hueo20tcs	cm7whzxin000fs60hky65yi4a	+1 to Luke	2025-03-19 20:57:14.702	[]	{}
cm8gemoa6000fs60h152slzps	cm86b4oy00001s60h7n783nwj	cm7whzxin000fs60hky65yi4a	So much fun	2025-03-19 20:58:20.142	[]	{}
cm8hfnrwj0001s60hmlng1vl3	cm8gdj2hi000as60hc2wbiaun	cm7uu06ge0010s60hmocr9lu5	this is really nice James! Would be cool if the stack of images "unstacked" to the grid w/ a view transition... 😮‍💨	2025-03-20 14:14:57.283	[]	{}
cm8hi3hrz0003s60hy6ahqujo	cm8ejj5ki0013s60hd8277ucs	cm8hi0xco0001s60h0omgywsh	From the archives! Great share, @kyle	2025-03-20 15:23:09.887	[]	{}
cm8iupc140004s60hber0fbx9	cm8f1qlar004as60hueo20tcs	cm8eoxq7i003gs60h9clhrv79	Really nice Ryan!	2025-03-21 14:03:50.44	[]	{}
cm8iw0o5o000ns60hw3dcsner	cm8imrsl70001s60h0lmgstzk	cm7uu06ge0010s60hmocr9lu5	this is so dope! Let's make it a #mini	2025-03-21 14:40:38.988	[]	{mini}
cm8iwhaue0018s60ht8ks9lrj	cm8i3jjjf0001s60h97wex0cm	cm8ei0oz5000hs60hf1b48fw9	Lovely Ryan! This makes me think about how we could condense/expand guides on Home.	2025-03-21 14:53:34.887	[]	{}
cm8iy1aiy001js60hyc5n6k2x	cm8f0xzec0044s60hrqiidfh7	cm7nx40e20005s60hqluumzai	love that shrinking transition!	2025-03-21 15:37:07.21	[]	{}
cm8iztast001qs60hr7h98lxo	cm8iw38e6000ts60hjv5rftzd	cm8erl7u80003s60hebi0qrx1	This is rad. Great job :)	2025-03-21 16:26:53.549	[]	{}
cm8j1ycic001us60htcawijxp	cm8iw38e6000ts60hjv5rftzd	cm7uu06ge0010s60hmocr9lu5	thanks @greg!	2025-03-21 17:26:48.276	[]	{}
cm8jacvpg0025s60hgiyc2yru	cm8j9s9xr001ys60h6eq5osfa	cm7uu06ge0010s60hmocr9lu5	one more - It could also create a wirecutter style pod comparing and recommending products in a collection... 🤔 	2025-03-21 21:22:03.268	[]	{}
cm8lvgnz70001s60hyq991lj6	cm8izlqus001ns60hrecbqqf0	cm8ei0oz5000hs60hf1b48fw9	#growth	2025-03-23 16:48:24.163	[]	{growth}
cm8m5n5850001s60hxot4xarv	cm8iwaq6p0012s60hkam4y9d0	cm6thw30g0008s60hkrj1wnge	#shop	2025-03-23 21:33:22.613	[]	{shop}
cm8m9hvm90001s60hh1e3q6le	cm8j9z0ke0021s60he1v3wbhp	cm8ei0oz5000hs60hf1b48fw9	don't mind one bit	2025-03-23 23:21:15.345	[]	{}
cm8n4647w0002s60h362grifv	cm8jd25jx002es60hgssmv2el	cm7oyhrpy0000s60hp7oifrws	Sick!	2025-03-24 13:39:54.716	[]	{}
cm8n5w9nn0004s60hgstg6rod	cm8fz9bh5000bs60h01qrx6vi	cm6thw30g0008s60hkrj1wnge	Feel like it would be nice to maintain a bit of a peek on the former context.	2025-03-24 14:28:14.436	[]	{}
cm8n60efo0006s60h5atvav63	cm8jd25jx002es60hgssmv2el	cm6thw30g0008s60hkrj1wnge	Cool concept! I would suggest some easing/animation curves so that the transitions between states don't feel so stiff. 	2025-03-24 14:31:27.252	[]	{}
cm8n8lcvf0002s60hbuis9oys	cm8j9z0ke0021s60he1v3wbhp	cm7uu06ge0010s60hmocr9lu5	thanks @jonathan!	2025-03-24 15:43:44.235	[]	{}
cm8nl4yu00004s60hqxjhzqqb	cm8je556p002rs60hip197318	cm8em6fwr002fs60h69moo9ct	It's so cute 🥺 — but something about the bars aren't clear that their sound waves / voice. I think it might just be missing the fourth one	2025-03-24 21:34:54.552	[]	{}
cm8nwdcln0004s60hls8y4qw1	cm8jd25jx002es60hgssmv2el	cm8em6fwr002fs60h69moo9ct	That's cool! It'd be a nice addition if the "Off Mode" had "Muted" (smaller) sound bars. Then the toggle one, seeing the sound bars activate, would be even more delightful.	2025-03-25 02:49:21.42	[]	{}
cm8okb9jd0003s60hzdvrtctg	cm8ni226s000es60hqug5mcu3	cm8ok0f7k0001s60hd2cmwhmj	SLIIIIICK	2025-03-25 13:59:34.922	[]	{}
cm8olmhdw0007s60hmheoljh7	cm8nw86310001s60hf5vw23p3	cm8ei0oz5000hs60hf1b48fw9	So fun. I'd love to see how you built this in Rive!	2025-03-25 14:36:17.924	[]	{}
cm8olqtyu0009s60hwprr3lzd	cm8jd25jx002es60hgssmv2el	cm8etdrpr0022s60ho61sbpqb	100% Katarina – Figma wasn't quite letting me express the right easing animations on this one, so i couldn't quite get it right here. Fun fact – prototypes go out of wack if you don't check off reset component state 🫠.\n\n@Joseph, that's a great idea!\n\nOverall – we've moved away to a different iteration completely. More on that soon!	2025-03-25 14:39:40.854	[]	{}
cm8olsqc6000bs60hxpxw81hq	cm8nw86310001s60hf5vw23p3	cm8etdrpr0022s60ho61sbpqb	Omg loveee! And +1 ^^^	2025-03-25 14:41:09.462	[]	{}
cmek67l6b000as60hh0j3pjrg	cmek60sa30001s60h67qi1tla	cm8ysolaf0000s60h165ztlk4	Credit goes to @Nick Tchir	2025-08-20 16:11:58.067	[]	{}
cm8olztoh000ds60hsmano61u	cm8je556p002rs60hip197318	cm8etdrpr0022s60ho61sbpqb	Ah yes Joseph, I had to remove it to bring in the lil sparkle. We're moving back to the 4 bars though :). \n\nGenerally, iconography for voice has been a  🌶️  topic and i'd love to test some variations. Lots of iterations later, playing into some of what you see Perplexity, GPT, and others do made most sense for some recognizability of feature.	2025-03-25 14:46:40.385	[]	{}
cm8om67ia000fs60hcm4bkc8h	cm8izlqus001ns60hrecbqqf0	cm6thw30g0008s60hkrj1wnge	Curious about the feed model here vs more progressive disclosure (eg. a stack of cards). There is quite a lot going on between the feed and the different spaces a user can get into. There are a lot of different spatial metaphors being deployed here it feels like you might benefit from reducing one or two for clarity.	2025-03-25 14:51:38.242	[]	{}
cm8omagex000hs60hlpdxss1h	cm8in4mh10007s60hvf0ajalm	cm6thw30g0008s60hkrj1wnge	Consider animating away the bottom sheet as the checkout preview comes to the forefront, that spatial metaphor is lost without this detail. You've also got two different ways to dismiss a modal, a handle and a back button, I suggest choosing one dismissal UI for navigating the stack when using modals. 	2025-03-25 14:54:56.409	[]	{}
cm8ox8sd90005s60hw5fe46zk	cm8nsm68p0001s60hd6cq17dr	cm7uu06ge0010s60hmocr9lu5	this is beautiful! 	2025-03-25 20:01:34.365	[]	{}
cm8oxb65y0007s60h78sfg8ir	cm8oqp97o0013s60hr4mujt67	cm7uu06ge0010s60hmocr9lu5	Lovely stuff Owen! Having this respond to shaking your phone would be a fun little easter egg... 	2025-03-25 20:03:25.559	[]	{}
cm8q3wfyy000bs60hhred5zy0	cm8q3w3ws0008s60hug05sk0p	cm87e0fpo0000s60ha7hoh1rr	#shop	2025-03-26 15:55:41.914	[]	{shop}
cm8q5zh9v0002s60htkmj3pu6	cm8izlqus001ns60hrecbqqf0	cm8erl7u80003s60hebi0qrx1	Great feedback Katarina :) The idea here is that we want merchants to understand what it takes to make their first sale. In this direction we're updating a bit how we handle guidance all up but I too like the idea of refining the "what's up next" idea vs a feed. \n\nDefinitely something to explore as we push into this more. Thanks!	2025-03-26 16:54:02.803	[]	{}
cm8q6ai680004s60hz5wntb06	cm8izlqus001ns60hrecbqqf0	cm8erl7u80003s60hebi0qrx1	The user also just came from a very focused prog. disclosure model in onboarding too, so we don't want to duplicate the exact representation if they skipped everything upon entry too. It's a careful balance.	2025-03-26 17:02:37.184	[]	{}
cm8qp3bgd0004s60ho4bynhqu	cm8qlbtg00002s60hhxmklc1e	cm8esf3rq000ys60hv7l3k2vy	so nice! love the sense of weightlessness as they float away. 	2025-03-27 01:48:54.59	[]	{}
cm8rud72j0006s60hgirhq6fn	cm8rsu22q000ns60h2j9d1gz8	cm8ei0oz5000hs60hf1b48fw9	love this idea Luke!	2025-03-27 21:04:19.723	[]	{}
cm8sadoqz0001s60hx86muuwp	cm8nsm68p0001s60hd6cq17dr	cm8ei0oz5000hs60hf1b48fw9	thanks luke!	2025-03-28 04:32:36.491	[]	{}
cm8ynw4uv0006s60h4kmgbnao	cm8t4dlqa000js60hdjh9rsn1	cm8exr4mq003qs60hcxg1wm7v	Cool! Is this HTML/CSS or a design prototyping tool?	2025-04-01 15:37:29.239	[]	{}
cm8ytjp3j0006s60hm319exck	cm8yk9t2y0001s60hx9jl9osd	cm8erl7u80003s60hebi0qrx1	Good stuff Jordan. I like the elegant simplicity of this.	2025-04-01 18:15:46.639	[]	{}
cm90ev8qw000as60h0n788avk	cm90dguis0007s60hrc85mkbv	cm7uu06ge0010s60hmocr9lu5	Lovely. What are you creating this in?	2025-04-02 21:00:23.433	[]	{}
cm91o2rgz0003s60hq6m16h7q	cm90dguis0007s60hrc85mkbv	cm8elt5yz0029s60hc2wwhebn	Thank you Luke! This was made in Cinema4D + Redshift renderer.	2025-04-03 18:05:57.012	[]	{}
cm97k3wib0001s60h86mr5qmt	cm8t4dlqa000js60hdjh9rsn1	cm8n6hq410007s60h9j7ivkby	@ryan I made this through prompts in v0 :))	2025-04-07 21:01:28.787	[]	{}
cm97k46rh0003s60h0wcmmhb7	cm8t4dlqa000js60hdjh9rsn1	cm8n6hq410007s60h9j7ivkby	Here if you wanna play around with it and polish it further - https://v0.dev/chat/interactive-holographic-card-lPcdIF5re9H?b=b_iQ8sHU97D1N	2025-04-07 21:01:42.078	[]	{}
cm97ssp180001s60hdew3jogr	cm97ful3l0007s60hva67wphh	cm7uu06ge0010s60hmocr9lu5	looking great! 	2025-04-08 01:04:42.428	[]	{}
cm98vy2as0001s60hlzm1zdmi	cm98u7mtx0001s60h857lgly7	cm8j3b3je001vs60h1s728b28	hawtttt	2025-04-08 19:20:37.924	[]	{}
cm9bg3h690004s60hc53pe3io	cm930sj6e0001s60hukd1d96m	cm7z93nvr0004s60hcxgjwyln	Those floating images are DIRTY	2025-04-10 14:20:15.154	[]	{}
cm9bl8at30001s60h7qahp06f	cm9bg2h4b0001s60hd0oa3ccf	cm7uu06ge0010s60hmocr9lu5	lovely transitions... are you creating in figma?	2025-04-10 16:43:58.263	[]	{}
cm9iuwa8x0001s60hkzv38vpa	cm9bg2h4b0001s60hd0oa3ccf	cm7z93nvr0004s60hcxgjwyln	Yeah, Figma for now but going to dabble with them in Cursor. So I will report back!	2025-04-15 18:48:57.057	[]	{}
cm9ms860e0001s60hgbjcuxu8	cm9inbrso0001s60hqj0ggxt8	cm8ei2u30000is60hxldwf8tc	Woah! Search by quadrant chart is a cool concept. I also like the loading blur + transition-in of the cards. \n\nThe add/search feature is a bit confusing to me. What happens after I add products to the search box? I need to input details and.. search for something else? I was expecting them to be added to a collection of some sort, but then I saw the search box and that threw me. 	2025-04-18 12:45:17.294	[]	{}
cm9msc8xo0003s60hbmxcz3c1	cm9inbrso0001s60hqj0ggxt8	cm8ei2u30000is60hxldwf8tc	Also unsure about that plus card in the bottom card stack. Is it clickable? It might be a helpful indicator when no products are added, but feels unnecessary once products are already there.  	2025-04-18 12:48:27.708	[]	{}
cm9r7ljpm0002s60h1zapvrce	cm98u7mtx0001s60h857lgly7	cm9r7l1f10000s60hq8gvmecx	yeah that's the juice right there. All gas, no brakes. 	2025-04-21 15:06:40.523	[]	{}
cma75vklw0004s60h30aonlbd	cma2jjga6000as60hyptiho11	cm8ej63t6000ss60h99hkq1b2	long bois	2025-05-02 19:02:47.829	[]	{}
cmab8rxnf0001s60h6hpsuuse	cm8z6grrv0006s60hzzkwaf5n	cm8erl7u80003s60hebi0qrx1	Dang, this would be a super cool way to filter apparel options as you browse. Great idea :)	2025-05-05 15:35:01.659	[]	{}
cmacvc1j10001s60hdk12n0rb	cma2jiatz0007s60htno9u01e	cm6zewlv30000s60hiwupvnso	So awesome!	2025-05-06 18:54:17.533	[]	{}
cmayizote0002s60hdp72trcb	cmaya0qbe0001s60hve0x07u3	cm7lyry250000s60hl4e0yfts	#shop	2025-05-21 22:39:41.667	[]	{shop}
cmebuqd3d000cs60hmcpk7c38	cm7uthmme000vs60hrgjgzexn	cm8ru7ucd0003s60hm5kqwdqq	this is actually really easy to do with images now that we have the blurhash for everyone	2025-08-14 20:28:29.258	[]	{}
cmebusrhd0005s60hgszavhv1	cm7uthmme000vs60hrgjgzexn	cmeburzer000ds60hzqs3fx60	Are you slack while on TH	2025-08-14 20:30:21.218	[]	{}
cmebuswt2000ds60hyao3s3j0	cm7uthmme000vs60hrgjgzexn	cmeburzer000ds60hzqs3fx60	on slack*	2025-08-14 20:30:28.118	[]	{}
cmebva3i50011s60h4f8e331h	cm8ektf3w001xs60h6gqh4sv2	cmebusvf9001ns60hfbqadrlj	! AMAZING !	2025-08-14 20:43:49.949	[]	{}
cmeczlp2d000ms60he92g9vz1	cmeczk7y6000js60h9f2hapz1	cm7uzjhwo0001s60ht1tuhtfi	#admin #sidekick	2025-08-15 15:32:35.749	[]	{admin,sidekick}
cmek680e1000cs60h4wrkbzcn	cmek61lgx0004s60hh1x7uetv	cm8ysolaf0000s60h165ztlk4	Credit goes to @Nick Tchir	2025-08-20 16:12:17.785	[]	{}
cmek68czd000es60hzjkhbxbw	cmek62iz80007s60h773yg3o5	cm8ysolaf0000s60h165ztlk4	Credit goes to @Nick Tchir	2025-08-20 16:12:34.106	[]	{}
cmf48mklw0001s60hy4y7ilad	cm8nw86310001s60hf5vw23p3	cm8em6fwr002fs60h69moo9ct	#talent #rive	2025-09-03 17:14:59.924	[]	{talent,rive}
cmfco3l5k0001s60h1hg42bdn	cmf4bpqz40004s60h1gij2msr	cm7lyry250000s60hl4e0yfts	#shop	2025-09-09 14:50:17.432	[]	{shop}
cmfco3r7n0003s60h0s162btr	cmf4bi1d70001s60hrdntg00c	cm7lyry250000s60hl4e0yfts	#shop	2025-09-09 14:50:25.283	[]	{shop}
cmffg4akv0001s60hvyrkcfv8	cmdt859gr0001s60hkiy7duj9	cm8ej63t6000ss60h99hkq1b2	Iconic work as always, Erich!!! 	2025-09-11 13:30:11.983	[]	{}
cmfoiymnn0001s60hr1y0gig2	cmffg7dfl0003s60h4vkahml5	cmesx6ypb0001s60h7oor91x8	SO fun! 	2025-09-17 21:59:42.131	[]	{}
cmfoj8ld40003s60h6biryu52	cmfcxl6gp0004s60h7q3tnx0m	cmesx6ypb0001s60h7oor91x8	Nice! Love this	2025-09-17 22:07:27.016	[]	{}
cmfybqp3k0004s60h1ui7u5uv	cmfyboneh0001s60h4d50jd6u	cm8ei0oz5000hs60hf1b48fw9	Shiny $5 bill for the first person to guess the 🥧 movie reference	2025-09-24 18:35:16.496	[]	{}
cmg132pvs0001s60h6gtcycd6	cmg0zroof0003s60hplc820tk	cm8ev050c003fs60hl2cyyugr	That 3D view though	2025-09-26 16:55:59.368	[]	{}
cmg14ferm0006s60hwjkvbeo6	cmg0zroof0003s60hplc820tk	cm8nk5rtq0002s60harmh7mlq	3D view is actually a quick midjourney video	2025-09-26 17:33:51.107	[]	{}
cmgb992r90005s60hk7nhupo7	cmgb7t1e60001s60h8m7ligqn	cm8ejcicz000zs60hjy10f6j3	Can the illustration be further simplified? I.e. less detail for the background screen (e.g., replace the small boxes with a couple of larger ones; eliminate the squiggly line on nav). Also for the chat - replace the callout shapes with simple round-corner rectangles	2025-10-03 19:46:35.445	[]	{}
cmgfehyc70004s60htoi1lqw7	cmgb7t1e60001s60h8m7ligqn	cm8ysolaf0000s60h165ztlk4	Good ideas! We're still running a test with this version, so if there's traction, I'll revise the illo. 👍	2025-10-06 17:24:32.408	[]	{}
cmggt3ofy0005s60hcq7xdjl2	cmggsyy5l0001s60hym6xirns	cm8ggdz9b0000s60hm651eb4x	Auth only, sorry. Not all of sign up. Coming soon...	2025-10-07 17:01:06.815	[]	{}
cmggtckgm0007s60h4xv5v1qe	cmggsyy5l0001s60hym6xirns	cm7uzjhwo0001s60ht1tuhtfi	the bag is crazy cool	2025-10-07 17:08:01.559	[]	{}
cmh0oxgca0002s60higqy4r5a	cmdt859gr0001s60hkiy7duj9	cm7lyry250000s60hl4e0yfts	#shop	2025-10-21 14:59:41.434	[]	{shop}
cmh58kynf0001s60hdq0iugqf	cmh54bqp60001s60hnosq5yan	cm7uu06ge0010s60hmocr9lu5	love it. how does one audition for a mini role? 	2025-10-24 19:20:55.659	[]	{}
cmhw4zi7f0005s60h0zoopn0o	cmhw4yndr0002s60he934ze00	cmf2s9kxe0003s60hq1y96kpr	https://pds-sidekick-plans.quick.shopify.io/	2025-11-12 15:10:02.476	[]	{}
cmhxops5p0001s60hji4woyn4	cmhw4yndr0002s60he934ze00	cm8ysolaf0000s60h165ztlk4	I'm enjoying the movement of the Sidekick surface and introducing new panels from the right. Moving Sidekick around depending on context feels so fluid. 	2025-11-13 17:10:07.309	[]	{}
cmi668f6u0004s60h1lzz428e	cmi6668m60001s60hgo813zoh	cmg17bxfr0000s60hzi42vlms	and google street view because it's too cold outside	2025-11-19 15:42:39.846	[]	{}
cmi66gf230006s60hd4fd485t	cmi6668m60001s60hgo813zoh	cm8qjbu3o0000s60hs93wsv74	fun!	2025-11-19 15:48:52.923	[]	{}
cmi92m0kz000es60hte6oqu60	cmh54bqp60001s60hnosq5yan	cm7lyry250000s60hl4e0yfts	#shop	2025-11-21 16:24:34.164	[]	{shop}
cmi92oihh000gs60hiytjgfkm	cmi92lie70006s60hy02feujs	cm7lyry250000s60hl4e0yfts	#shop	2025-11-21 16:26:30.677	[]	{shop}
cmi92onxx000is60h8l7dfzpj	cmi92lzvr000bs60hw9cbvslh	cm7lyry250000s60hl4e0yfts	#shop	2025-11-21 16:26:37.749	[]	{shop}
cmi930a2s000ks60hgpj9tvln	cmi92lzvr000bs60hw9cbvslh	cm7wbitsi000cs60hq1jnj3px	w/ Daniel Calderwood and Evany Thomas!	2025-11-21 16:35:39.652	[]	{}
cmi930nk9000ms60hj96inqyp	cmi92lie70006s60hy02feujs	cm7wbitsi000cs60hq1jnj3px	w/ Daniel Calderwood and Evany Thomas!	2025-11-21 16:35:57.129	[]	{}
cmi9f0kae000as60heih8dhlq	cmi9dl2nu0007s60h6y14vi4b	cm8oout7h000ss60hf7p2d45b	This is wonderful. That Shop logo in the middle of the strings might mess up my return but I don't even care.	2025-11-21 22:11:48.278	[]	{}
\.


--
-- Data for Name: Media; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Media" (id, filename, "contentType", "postId", "createdAt") FROM stdin;
cm8oqsa780017s60hjds7ob3f	cm8oli66z0005s60hee9a2ejd/wz9Jan8UeAJiYGal83ID3g==	image/png	cm8oqsa2j0016s60hnnhvbafd	2025-03-25 17:00:46.628
cm8ox36as0003s60hvaj627yg	cm7uu06ge0010s60hmocr9lu5/N0HvkKl7T2luJJtgTPHhgw==	video/quicktime	cm8ox36390002s60hmxhd0fqe	2025-03-25 19:57:12.484
cm7o0acla0002s60hmw6dchbt	cm6thw30g0008s60hkrj1wnge/ade79a8c0feee8aa74b63287a7c3542d	video/mp4	cm7o0acjl0001s60h0u4i93eg	2025-02-27 23:59:17.567
cm7tkj5yj0002s60hh4lcvxc9	cm7thki660000s60hlrru9mhx/bd6d30ffe70301d84f9abebfe4f806f3	image/jpeg	cm7tkj5x00001s60hw0u7mjmg	2025-03-03 21:24:52.076
cm7ukea6a0002s60h0g05ieqo	cm7okm0yo0000s60h4d4txvi3/4fdf9f7c06f0b640bda5089d6b4fb617	video/mp4	cm7ukea4h0001s60h67zd4qv5	2025-03-04 14:08:50.434
cm7ukffxe0005s60hxnmvxs5y	cm7okm0yo0000s60h4d4txvi3/860be854188262289ad872e022bb1927	video/mp4	cm7ukffwb0004s60hoykm17h1	2025-03-04 14:09:44.546
cm7ukgy600008s60hda11uetz	cm7okm0yo0000s60h4d4txvi3/2b199dc2c45d0835295ef7053afd42a2	video/mp4	cm7ukgy530007s60h5zfwfqbq	2025-03-04 14:10:54.841
cm7ul9fov0002s60hp83bjov7	cm7nm6s9j0000s60hxxf8hx4i/883bbd3b9cc1fa27daa1ca03c58b021e	video/mp4	cm7ul9fng0001s60hvttd8ctz	2025-03-04 14:33:03.92
cm7uodeko0005s60hsj322lps	cm7tp7xd4000gs60h1hu9598i/8e364c005b92c98243fecccdc76d3906	video/mp4	cm7uodej30004s60hgphhth8l	2025-03-04 16:00:07.944
cm7uouiiv0002s60hiuset55n	cm7nm6s9j0000s60hxxf8hx4i/7dec48796cbae9491a26a0cfdd4d3e53	video/mp4	cm7uouiha0001s60hlbtag2ni	2025-03-04 16:13:26.215
cm7us8yt30002s60hclxlmnz0	cm7nm6s9j0000s60hxxf8hx4i/1e3326c6ae0efc031fe64bd852d1a077	video/mp4	cm7us8yra0001s60hlb2u1hje	2025-03-04 17:48:39.351
cm7usaoas000bs60h5mug72cg	cm7nm6s9j0000s60hxxf8hx4i/b3df2859766a2d39b84d88b3be95beed	video/mp4	cm7usao9p000as60h4kx0w6qt	2025-03-04 17:49:59.045
cm7uso8v1000hs60hw6g0b0a2	cm7nm6s9j0000s60hxxf8hx4i/8feaed3bcd892398f8cd50a833492323	video/mp4	cm7uso8u2000gs60h25ogqyrj	2025-03-04 18:00:32.221
cm7utcdxs000qs60h7jt780a3	cm7nm6s9j0000s60hxxf8hx4i/4b0d61a821d9f155d5b9961b6b1b5582	video/mp4	cm7utcdwt000ps60h60t2xytj	2025-03-04 18:19:18.545
cm7utf7mw000ts60hypt0juty	cm7nm6s9j0000s60hxxf8hx4i/05a8f26108d61a7c46baddaefe82f871	video/mp4	cm7utf7lz000ss60hble5gyvi	2025-03-04 18:21:30.344
cm7uthmne000ws60hrhpbwabn	cm7nm6s9j0000s60hxxf8hx4i/43ac32fbd41a82a9cee0dfb0845a3dd5	video/mp4	cm7uthmme000vs60hrgjgzexn	2025-03-04 18:23:23.115
cm7utlp71000zs60h0m6qzrc1	cm7tp7xd4000gs60h1hu9598i/fc507d00fcd912f15a0656e587d475a7	video/mp4	cm7utlp61000ys60hfc4jw1r3	2025-03-04 18:26:33.037
cm7uu1aak0013s60hxb6w37xo	cm7tp7xd4000gs60h1hu9598i/de0f1fda58a6ac616b73c455661ee0c4	video/mp4	cm7uu1a8j0012s60hj6syajw8	2025-03-04 18:38:40.22
cm7uv4anj0005s60h2991dify	cm7nx40e20005s60hqluumzai/197c18065e14478beb18714323a42318	video/mp4	cm7uv4am70004s60h5s1sqk37	2025-03-04 19:09:00.272
cm7uv7ose0008s60hni893211	cm7nx40e20005s60hqluumzai/55f66271548ad3949bd4e601f6f8f4a4	video/mp4	cm7uv7orb0007s60hb3j0qdgm	2025-03-04 19:11:38.559
cm7uvayjn0002s60h34wtgh2w	cm7uu06ge0010s60hmocr9lu5/021111b4dff6cf932f81aa9e9c4b821c	video/quicktime	cm7uvayht0001s60hs226e8tj	2025-03-04 19:14:11.171
cm7uvb7i70005s60hzpddl1f9	cm7nx40e20005s60hqluumzai/2e36daaa068b0057bc4f2098e51779ad	video/mp4	cm7uvb7h40004s60hv150poaz	2025-03-04 19:14:22.784
cm7uvcimi0002s60h10kmw847	cm7nx40e20005s60hqluumzai/24f7cd68343a0e4e6b9a3f8586964e2b	video/quicktime	cm7uvcikp0001s60hoa3su9eh	2025-03-04 19:15:23.851
cm7uvdjd90005s60hg1uaxros	cm7nx40e20005s60hqluumzai/df701544e653cc44fab33634b2c3bc47	video/mp4	cm7uvdjbt0004s60hsee3h5k9	2025-03-04 19:16:11.47
cm7uvegry0008s60h9w6v5o38	cm7uu06ge0010s60hmocr9lu5/ad5b5562a51332a0f0979640b31b6f17	video/quicktime	cm7uvegr20007s60h6w4zx11n	2025-03-04 19:16:54.766
cm7uvfdhx000bs60hg98vgvpg	cm7nx40e20005s60hqluumzai/8170013e90b390dcd046335eb1928112	video/mp4	cm7uvfdgt000as60hcnr2xplx	2025-03-04 19:17:37.174
cm7uvgeu6000es60hyi6doivh	cm7uu06ge0010s60hmocr9lu5/46299da78aa663dc0241536a9a1f084e	video/quicktime	cm7uvget8000ds60hdwkth9xm	2025-03-04 19:18:25.566
cm7uvib5r000hs60hlu32sql8	cm7nx40e20005s60hqluumzai/aab3986d2d02f013418663a7107d8c18	video/mp4	cm7uvib4p000gs60h83y0rcxv	2025-03-04 19:19:54.112
cm7uviixq000ks60h4xjhlutk	cm7uu06ge0010s60hmocr9lu5/36d500fbce915bea8d487f647b45a915	video/quicktime	cm7uviiwu000js60hgzwq30bq	2025-03-04 19:20:04.191
cm7uvk1uw000ns60hukdoqqhl	cm7nx40e20005s60hqluumzai/9ac398b9fd37f1f371cc5fddd2d52b94	video/quicktime	cm7uvk1tt000ms60hj8oqnx3f	2025-03-04 19:21:15.368
cm7uvk2je000qs60hfnkrguh1	cm71zq1uu0000s60hsrg9iv1g/1d1f931ea9059b1e1f4d3e468bd9402a	video/quicktime	cm7uvk2id000ps60hiheaq4pp	2025-03-04 19:21:16.25
cm7uvk2jt000rs60hc9xakf93	cm71zq1uu0000s60hsrg9iv1g/7ec02664e18bc1bfccdbd78510464582	image/png	cm7uvk2id000ps60hiheaq4pp	2025-03-04 19:21:16.265
cm7uvlex1000us60hqhlu4sl3	cm7uu06ge0010s60hmocr9lu5/37059f0dbacd2963c5b308252b54f7f8	video/quicktime	cm7uvlew0000ts60hgniec6q0	2025-03-04 19:22:18.95
cm7uvpud8000xs60h691pvwha	cm71zq1uu0000s60hsrg9iv1g/2308526af8eff64defbe93a4dc03e971	video/quicktime	cm7uvpubv000ws60hanahf68l	2025-03-04 19:25:45.596
cm7uvtrjd0010s60hfh0x5cib	cm71zq1uu0000s60hsrg9iv1g/d73e7f37c837c2f32eaea8923c4a028e	video/quicktime	cm7uvtrif000zs60hdsghppzr	2025-03-04 19:28:48.554
cm7uwa1ox0013s60huq6vezlw	cm7uu06ge0010s60hmocr9lu5/42622361dafa4806040919f6e3b8f9c5	video/quicktime	cm7uwa1nc0012s60hx9pge64v	2025-03-04 19:41:28.21
cm7uwdjak0016s60he4gnfxbr	cm7uu06ge0010s60hmocr9lu5/c575f537f0864c6eba5ad5ef19a808f0	video/quicktime	cm7uwdj9f0015s60holtk67gg	2025-03-04 19:44:10.988
cm7uwg0sp0019s60hxkbk01z1	cm7uu06ge0010s60hmocr9lu5/8efcaf0f438d41182203392cfcad4cb9	video/quicktime	cm7uwg0r90018s60hw22le3q7	2025-03-04 19:46:06.986
cm7uwlol2001cs60htdeox8zs	cm7uu06ge0010s60hmocr9lu5/21aa01f1ef18a7338eabd6c98925dc49	video/quicktime	cm7uwlojp001bs60h2g3mbgr4	2025-03-04 19:50:31.095
cm7uwu1wu001fs60hp3bl7swh	cm7uu06ge0010s60hmocr9lu5/a394f10fd2d959fa616974f6ac0178f0	video/quicktime	cm7uwu1vf001es60hf1ky4vhh	2025-03-04 19:57:01.614
cm7uwz9xw0002s60hxd5nlt14	cm7uu06ge0010s60hmocr9lu5/d9dd6a02dec0059315040e752a85f95b	video/quicktime	cm7uwz9w10001s60hh2vp7h4w	2025-03-04 20:01:05.3
cm7uxdgma0005s60hs25xhd4q	cm7uu06ge0010s60hmocr9lu5/e2711b6d0b0ae89e32e4a581d912c0e2	video/quicktime	cm7uxdgl70004s60htfjdkuu7	2025-03-04 20:12:07.138
cm7uxh7o10008s60h2mf3rtup	cm6zewlv30000s60hiwupvnso/795c817e9721cc9cb0d7f247ecd1bd5e	video/quicktime	cm7uxh7mr0007s60hyf22h24l	2025-03-04 20:15:02.161
cm7uxlkij000bs60h9h2ew87a	cm6zewlv30000s60hiwupvnso/d30fd4c5bfdc9b742bb8a7aad004ec2e	video/quicktime	cm7uxlkh6000as60hmjf7xn1r	2025-03-04 20:18:25.435
cm7uxr4hg000es60hsofkeqdc	cm6zewlv30000s60hiwupvnso/671707ecc53a32380cda2ae1ea82f10f	video/quicktime	cm7uxr4fn000ds60h52jkajem	2025-03-04 20:22:44.596
cm7uyak3q000is60ho8k578cd	cm6zewlv30000s60hiwupvnso/2017dc1b6b909f7babe7f37230dd97ae	video/quicktime	cm7uyak1n000hs60hs1bjsz6z	2025-03-04 20:37:51.303
cm7uyb304000ls60h68evvmpc	cm6zewlv30000s60hiwupvnso/fa3d66df2b38b7cc16394899f07cb273	video/quicktime	cm7uyb2z0000ks60hmdec8d3r	2025-03-04 20:38:15.796
cm7uyexl4000os60hshtiqutv	cm6zewlv30000s60hiwupvnso/cc7ab31768f5940f4d8c591ae1c5beb7	video/quicktime	cm7uyexk9000ns60heh3q29i5	2025-03-04 20:41:15.4
cm8oqlwty0011s60h88njpe8f	cm8esf3rq000ys60hv7l3k2vy/k1rDZ0nYPkI5jjjWJSRafA==	video/mp4	cm8oqlwmx0010s60hu648lt2s	2025-03-25 16:55:49.366
cm7v05hhx0002s60h501xqts7	cm71zq1uu0000s60hsrg9iv1g/6febe60223713bb3abbc6aafc3e30190	video/quicktime	cm7v05hfv0001s60hq0hk21zo	2025-03-04 21:29:53.877
cm7v06i500005s60hez3rpto9	cm71zq1uu0000s60hsrg9iv1g/2d777de42cbac84229679add40cfc436	video/quicktime	cm7v06i3i0004s60hrx2pj8cv	2025-03-04 21:30:41.365
cm7v0agy80008s60h71r2kfcr	cm71zq1uu0000s60hsrg9iv1g/c59d71120aa4209b67f0724e6a22af85	image/png	cm7v0agxa0007s60hb3j6gs65	2025-03-04 21:33:46.449
cm7v1yy1y0002s60hq2xm56qf	cm7uu06ge0010s60hmocr9lu5/17ca34b0c29a4212196c1ff60b39254e	video/quicktime	cm7v1yy0h0001s60hzorcxbo0	2025-03-04 22:20:47.974
cm7v98wju0005s60hc844oq2u	cm7thki660000s60hlrru9mhx/1acfdb38dd1570dda4607ff8f50b3c99	image/png	cm7v98wiu0004s60hkrzq4t4j	2025-03-05 01:44:29.899
cm7vu64f40002s60hzrrymfzx	cm7nx40e20005s60hqluumzai/c504a8ee09111edbc2e18eccb29c9528	image/png	cm7vu64d70001s60hq66p7i9k	2025-03-05 11:30:12.064
cm7w056ai0004s60hzqep9d4g	cm7thki660000s60hlrru9mhx/488109947a5235b4b2969172fca5ad9a	video/mp4	cm7w0568r0003s60hojgh9182	2025-03-05 14:17:25.53
cm7w1j7wi0002s60hyabqd89i	cm7uu06ge0010s60hmocr9lu5/9ad031b9ad13e68d00917a9948f4fda1	video/quicktime	cm7w1j7ta0001s60h6u4cvz22	2025-03-05 14:56:20.418
cm7w6s48e000es60hg6nruzwf	cm7w6pvky000bs60hmb38qjbd/7e1e438146a8ee7f9c655b5de8308610	video/mp4	cm7w6s471000ds60hhteycpba	2025-03-05 17:23:13.646
cm7wa8dxr0002s60hprg2se54	cm7uu06ge0010s60hmocr9lu5/b6bf7f8d9365748ae5a3ab700afac297	video/quicktime	cm7wa8dvu0001s60hnmjdvf2v	2025-03-05 18:59:51.567
cm7waep6r0008s60hzej0017r	cm71zq1uu0000s60hsrg9iv1g/a42e154f37e3889262a75e7dd5734d60	video/quicktime	cm7waeowe0007s60h18k6rzg4	2025-03-05 19:04:46.083
cm7wc8dm50002s60hrona62ln	cm71zq1uu0000s60hsrg9iv1g/8nTeOEEH3F+MyvEXrUvybg==	video/quicktime	cm7wc8dh30001s60hvx2pqvrf	2025-03-05 19:55:50.381
cm7wgl5bp0002s60hfiwlkt6s	cm7uu06ge0010s60hmocr9lu5/1IuME01VMVadjdEtD1FFpQ==	video/quicktime	cm7wgl5640001s60hp74l7kv5	2025-03-05 21:57:44.629
cm7whtoq8000bs60hc3i46i7c	cm7uu06ge0010s60hmocr9lu5/0V8cB3MNrMsTEe8ufQbyqw==	video/quicktime	cm7whtol2000as60halg7wpm9	2025-03-05 22:32:22.641
cm7wjiksu000us60h15mfsfay	cm7wayd3g000bs60htgdbt3mm/vnbcPXCulR3Ra03OAmHSCQ==	video/quicktime	cm7wjiknm000ts60hodvu94qr	2025-03-05 23:19:43.566
cm7xvb8xj0002s60hemh866bx	cm7wbitsi000cs60hq1jnj3px/0x+vdgb8qHgZZoKe+KGs1w==	video/mp4	cm7xvb8s10001s60hqqjdckj2	2025-03-06 21:37:43.159
cm7xw0l980006s60haoznk0kd	cm7tp7xd4000gs60h1hu9598i/TsCqMMIWcQWsNLZwKHDRJQ==	video/mp4	cm7xw0l2h0005s60hr2gi3wxw	2025-03-06 21:57:25.532
cm7z5dzqg0002s60hm4b0u7x5	cm7nx40e20005s60hqluumzai/As0Z1BQ/JqfAiXwwjxEmLA==	video/quicktime	cm7z5dzk80001s60hauwe8nfn	2025-03-07 19:07:33.544
cm7z871oz0002s60h3tnahac7	cm7uu06ge0010s60hmocr9lu5/81qjWkxSOcx8SBdcTmrSNw==	video/quicktime	cm7z871iw0001s60hnn5oaf9z	2025-03-07 20:26:08.34
cm7z980td0009s60h8bm5uwyk	cm7z93nvr0004s60hcxgjwyln/4VTDXI3d/5ikdFgQqth/9Q==	video/mp4	cm7z980mr0008s60hle3wo05d	2025-03-07 20:54:53.473
cm7z9mqaf000fs60hnshblpkf	cm7nx40e20005s60hqluumzai/XOkiiKFCzuN9V2q4BFWGYw==	video/quicktime	cm7z9mq4d000es60hoko4z84k	2025-03-07 21:06:19.671
cm7z9oj1y000is60h07crsujk	cm7z9lkyy000cs60h9jintrt8/F6aZwm1OZAaSrF3fpquidA==	image/gif	cm7z9oixg000hs60hrssu3mcm	2025-03-07 21:07:43.607
cm7za6t6p000ms60hy24c75v8	cm7za6450000js60h1p0i3k3s/apEA982o8Wc4sAc0DpFskw==	video/mp4	cm7za6t1t000ls60hdoyfin2j	2025-03-07 21:21:56.546
cm7zc7mb90003s60h56wvrk7k	cm7zc3ylp0000s60hpc7gtlbl/3HX7Vs8ieL/sMgIixqSK9Q==	image/gif	cm7zc7m5w0002s60howj4gftu	2025-03-07 22:18:33.525
cm7zdg0m80002s60h41tmhbjf	cm7waaezb0005s60hjxfkpznf/fD+Ek/pktSyhmmtr4yrpyw==	video/mp4	cm7zdg0fy0001s60hxbjfha48	2025-03-07 22:53:04.929
cm7zdmh5n0008s60hliaexybi	cm7yx5dc50000s60hlu2jxmg4/OKgVRUF5WcolMCPLns1Cxg==	video/quicktime	cm7zdmh0x0007s60hlydi70bn	2025-03-07 22:58:06.299
cm7zdosa9000bs60hc6nzc06e	cm7yx5dc50000s60hlu2jxmg4/0fbSt7ogfXFVEQAplFYBgQ==	video/quicktime	cm7zdos4i000as60hoqj2csxx	2025-03-07 22:59:54.033
cm7zdtsa0000es60hqe46ep5h	cm7yx5dc50000s60hlu2jxmg4/YnMFhoEAd9bJeNkZ+iKn/w==	image/png	cm7zdts4q000ds60hdjbaeuci	2025-03-07 23:03:47.304
cm8383mtf0002s60hqhq652qr	cm7z9l7jf000bs60hg2j29tcc/o4IUjnwd0PN0jB0hV//AbA==	video/mp4	cm8383mo00001s60hh469qamg	2025-03-10 15:34:33.795
cm838xums0008s60h84jl837p	cm838k8c90004s60hgmf319ly/9ShGwmZnkTmhI1rizRv6Nw==	video/mp4	cm838xuhs0007s60hv0f03s5x	2025-03-10 15:58:03.604
cm8393uo8000bs60hxi6tn7bp	cm838k8c90004s60hgmf319ly/6vwII0wWzYMWNJ1DtkgHDA==	video/mp4	cm8393uj3000as60h2e9ykmd3	2025-03-10 16:02:43.592
cm83kpwbg0002s60hz3ucig90	cm7uu06ge0010s60hmocr9lu5/D029vC/cc1r4pbZziOKmQA==	video/quicktime	cm83kpw670001s60h24lrp5gx	2025-03-10 21:27:47.932
cm853knka0002s60hcrglteqv	cm84lb2sn0000s60hqn6v7ogq/jS2n+OfsmGftKOEIW8vFNg==	video/mp4	cm853knc50001s60hq3etfnjd	2025-03-11 23:03:22.187
cm86b4p5g0002s60hesxmh0ye	cm7uu06ge0010s60hmocr9lu5/buUFv6+in7s/WsxI3B3z0A==	video/quicktime	cm86b4oy00001s60h7n783nwj	2025-03-12 19:22:40.853
cm89gtntr0002s60hd0et9m4v	cm7w8mea50002s60h0gesz0yx/ihmOP04QLdN/T+HxFQ5mTA==	video/mp4	cm89gtnna0001s60hl76g5y62	2025-03-15 00:25:22.143
cm8ej8ork000ws60h01gdvi8g	cm8ei2u30000is60hxldwf8tc/7/4G7uM5wAGsY/lm/s7Ulg==	video/mp4	cm8ej8ol7000vs60huveq21a1	2025-03-18 13:31:53.312
cm8ejj5qt0014s60hayuzg6wf	cm7xlifn90000s60hihjg8d5q/H0S5mOsNPY1Qs/tZxLbg6w==	video/mp4	cm8ejj5ki0013s60hd8277ucs	2025-03-18 13:40:01.878
cm8ektfd0001ys60h9w908x4z	cm8ek25cp001js60ht0j4wini/AFH2QTxsKCEAKZbV9oaZqA==	video/mp4	cm8ektf3w001xs60h6gqh4sv2	2025-03-18 14:16:00.517
cm8elxfss002es60hu1o9nnzv	cm7uu06ge0010s60hmocr9lu5/fUl96UXdD1JUeQAcgju0Pg==	video/quicktime	cm8elxfnk002ds60h8zl13njy	2025-03-18 14:47:07.324
cm8ep9pey003ps60hl658epkk	cm8eo58zt0036s60ht4c3mf3x/lYUSJ6EL4OY35RCRYUC1pA==	video/quicktime	cm8ep9p9g003os60hz2ssc0h5	2025-03-18 16:20:38.506
cm8equo7z000es60hf9e515r0	cm8eqiaqa0004s60h5jnuu2om/ygpj6URQUV19mNiD7hZFyQ==	video/mp4	cm8equo2f000ds60hq7ckbk2e	2025-03-18 17:04:56.351
cm8eqzpnh000ks60hwxfvqjlw	cm8eqiaqa0004s60h5jnuu2om//Gdmw7tU6JyhU6/zk+CKXA==	video/mp4	cm8eqzpj4000js60hvqdwltqg	2025-03-18 17:08:51.486
cm8erxx1j0009s60hrsgbq0ix	cm71zq1uu0000s60hsrg9iv1g/z0loArtD0+Ibf6NY0YVM+g==	video/quicktime	cm8erxww80008s60h9mk0wpos	2025-03-18 17:35:27.367
cm8es10am000ds60hlv81ttop	cm7nx40e20005s60hqluumzai/LjbaqgaLAFe8TyCY5Rd5rQ==	video/mp4	cm8es106n000cs60h6mffmpm4	2025-03-18 17:37:51.55
cm8es258h000gs60hgmr213i4	cm7nx40e20005s60hqluumzai/2C5A1JaRjVp0BBbId9WhDw==	video/mp4	cm8es254f000fs60h0hweva52	2025-03-18 17:38:44.609
cm8es3ijb000js60htp57aw0f	cm7nx40e20005s60hqluumzai/WLZyBNDBJjhsQv5UUgrbfA==	video/quicktime	cm8es3iev000is60he13o1tko	2025-03-18 17:39:48.503
cm8es3pan000ms60hje1qjo0l	cm71zq1uu0000s60hsrg9iv1g/lJaKe3J9ormk1CuRhUL6mg==	video/quicktime	cm8es3p6n000ls60hkl9ywy5l	2025-03-18 17:39:57.264
cm8es4g4g000qs60hh6uc97pc	cm7nx40e20005s60hqluumzai/UeU5QPRuFEBYaidvlR4cMA==	video/quicktime	cm8es4g04000ps60haqa4jm7t	2025-03-18 17:40:32.033
cm8es55oa000vs60hho5xc5nw	cm7nx40e20005s60hqluumzai/uCVda+YJLWeJAf8yZcuXhQ==	video/quicktime	cm8es55kl000us60h3lr62k6s	2025-03-18 17:41:05.146
cm8oqp9c40014s60hgxa0m3ho	cm8oli66z0005s60hee9a2ejd/iwrIoLZ94yi2ZHjMHtWI+Q==	video/quicktime	cm8oqp97o0013s60hr4mujt67	2025-03-25 16:58:25.54
cm8et8rbo0020s60h91gw7p6l	cm8erozd20005s60h3n1u3taw/d1gg+kWPKOKPlnb5jwToEw==	video/mp4	cm8et8r77001zs60hh3ssz5fm	2025-03-18 18:11:52.788
cm8or0ez9001as60h61mim5ox	cm8oli66z0005s60hee9a2ejd/NtO0nUZyjl4roLt0FWPcuA==	video/quicktime	cm8or0etc0019s60h2paltecq	2025-03-25 17:07:06.069
cm8psqnhz0003s60ha7d1h4ha	cm8pse5mn0000s60hyjrczgi5/glpSNhkmvhg2NgLH+5aNdw==	video/quicktime	cm8psqnb20002s60hiis3v3p3	2025-03-26 10:43:15.959
cm8q10s5k0004s60hh8oeldjy	cm8ggdz9b0000s60hm651eb4x/CvOxNJTQQqqCZ2SQPV5bRQ==	video/quicktime	cm8q10ryx0003s60h394c6g7g	2025-03-26 14:35:05.481
cm8q3w42i0009s60h4u9v6i5u	cm87e0fpo0000s60ha7hoh1rr/zK7aGEXf6fkoAT0Kl5t4TA==	video/quicktime	cm8q3w3ws0008s60hug05sk0p	2025-03-26 15:55:26.49
cm8eu90y5002vs60hk7iapaxq	cm8erozd20005s60h3n1u3taw/KGPvZRk9trfMsZG1ELwhFQ==	video/mp4	cm8eu90sm002us60h9hjogy8e	2025-03-18 18:40:04.878
cm8eu9ntt002zs60hp51ufgru	cm8erozd20005s60h3n1u3taw/37NUBPhh4c76CwSYzMuTVw==	video/mp4	cm8eu9np7002ys60h6sjdv66h	2025-03-18 18:40:34.529
cm8euaapr0032s60hucbc4021	cm8erozd20005s60h3n1u3taw/eGwUIVBOKw8tI0FdlkqUCQ==	video/mp4	cm8euaalp0031s60hjic1wzll	2025-03-18 18:41:04.191
cm8euasms0035s60hkmjwiy2f	cm8erozd20005s60h3n1u3taw/vYx/Ksm52X97I0fERgifqQ==	video/mp4	cm8euasid0034s60hy4ae3o89	2025-03-18 18:41:27.412
cm8eubauy0038s60huv1l0eil	cm8erozd20005s60h3n1u3taw/2KR8bdQIIPTLHcKo19QpmA==	video/mp4	cm8eubaqp0037s60hl1izkurk	2025-03-18 18:41:51.034
cm8f0xzj70045s60h3y91ocy5	cm8exr4mq003qs60hcxg1wm7v/JdVBLFU4y4jgIBN/BoaK1A==	video/mp4	cm8f0xzec0044s60hrqiidfh7	2025-03-18 21:47:27.14
cm8f1qlfu004bs60h1ey7g6fr	cm8exr4mq003qs60hcxg1wm7v/18rfaqziw/SRUPkSfNLUfw==	video/mp4	cm8f1qlar004as60hueo20tcs	2025-03-18 22:09:41.898
cm8f9w2310002s60htzq4t1d9	cm8eoqkdb003es60hu6elqii2/EWqRIfLtZHqKb7Ao2ijiCQ==	video/mp4	cm8f9w1xh0001s60hgn20kvqg	2025-03-19 01:57:53.677
cm8fz9bmz000cs60hxx9bzvuj	cm8fyv6xs0007s60h8mmy9uqd/piEVSdwYaFdeObjJwmWSGA==	image/gif	cm8fz9bh5000bs60h01qrx6vi	2025-03-19 13:48:02.988
cm8fzh192000fs60htghi88hp	cm8ejkt910018s60httxfcf76/SrQ5aDHpc8qurod/7wPIUQ==	video/mp4	cm8fzh13l000es60h3rda3os1	2025-03-19 13:54:02.774
cm8gdj2np000bs60hfldu9vul	cm7tp7xd4000gs60h1hu9598i/pMdd62d2ymiBWVVAAcrlqQ==	video/mp4	cm8gdj2hi000as60hc2wbiaun	2025-03-19 20:27:32.534
cm8hvaw520003s60hgrr15n3v	cm8eo1etv0030s60hwtdzr22r/E+E4NQYyuTgdaouFcxU7GA==	video/mp4	cm8hvavzo0002s60ht2aeqs06	2025-03-20 21:32:50.102
cm8i3jjph0002s60h0rxwwn6f	cm8ei2u30000is60hxldwf8tc/JHZcRlyThOHJQMVBAH8prw==	video/mp4	cm8i3jjjf0001s60h97wex0cm	2025-03-21 01:23:30.821
cm8qlbtnb0003s60h2nx7usqu	cm8ei0oz5000hs60hf1b48fw9/sBVM0KMcHAS1lc7tq5A62g==	video/mp4	cm8qlbtg00002s60hhxmklc1e	2025-03-27 00:03:32.951
cm8imrstx0002s60h6hnjgxjw	cm8ei2u30000is60hxldwf8tc/dHwSu+IWpr4O3TQVtaOBSA==	video/mp4	cm8imrsl70001s60h0lmgstzk	2025-03-21 10:21:48.598
cm8in04060005s60h9amvqw25	cm8ei2u30000is60hxldwf8tc/nFcoHMqmbaOa4wE8ZF6gFg==	video/mp4	cm8in03ty0004s60hz8yhyi2i	2025-03-21 10:28:16.326
cm8in4mls0008s60htl5m74d9	cm8ei2u30000is60hxldwf8tc/XJC8oByb42cp3n4+cJrd5A==	video/mp4	cm8in4mh10007s60hvf0ajalm	2025-03-21 10:31:47.056
cm8inc452000bs60ha6n8tmd4	cm8ei2u30000is60hxldwf8tc/fnj8W7aek1HbatS78ge8hQ==	video/mp4	cm8inc3z8000as60hddp7f7e3	2025-03-21 10:37:36.374
cm8rirhoc001rs60h4l49a72c	cm8esf3rq000ys60hv7l3k2vy/Uw+jqEJJWWEbOuh/n3tyhA==	video/mp4	cm8rirhir001qs60hgj93rie4	2025-03-27 15:39:31.261
cm8rjvbuj001ys60hwu9sm43b	cm8erl7u80003s60hebi0qrx1/gxhrQOLurTuGI9hXqfEmyQ==	video/quicktime	cm8rjvbnf001xs60haxekb9oq	2025-03-27 16:10:29.947
cm8iw24cf000rs60hu1dtpfck	cm8ei0oz5000hs60hf1b48fw9/IPa8lkn7AMseCetzYqeclA==	video/mp4	cm8iw2478000qs60hk4h023oz	2025-03-21 14:41:46.623
cm8iw38jj000us60hapl0qdfy	cm7uu06ge0010s60hmocr9lu5/q/bzOwjqiZPVvtRPnxEv+A==	video/quicktime	cm8iw38e6000ts60hjv5rftzd	2025-03-21 14:42:38.72
cm8iwaqce0013s60hwhdknri0	cm7nx40e20005s60hqluumzai/KiHyb17dTiCd8ct1rldSJw==	video/quicktime	cm8iwaq6p0012s60hkam4y9d0	2025-03-21 14:48:28.383
cm8rkb2590027s60hbueiy290	cm8erl7u80003s60hebi0qrx1/MktlhX2ptpBG1tJ4L6Ch4Q==	video/quicktime	cm8rkb1tr0026s60he0ouzo33	2025-03-27 16:22:43.87
cm8iwkki4001bs60hbqvtivyr	cm8hiiwlc0004s60h9o1yozwa/bRkuolgaDXGGGlzlC2qKjg==	image/png	cm8iwkkdl001as60hi0ziy5zi	2025-03-21 14:56:07.372
cm8izlr09001os60hqrdp0hxm	cm8erl7u80003s60hebi0qrx1/KUoxuQ2vDiRfW9a+UPtPfA==	video/quicktime	cm8izlqus001ns60hrecbqqf0	2025-03-21 16:21:01.305
cm8j9sa5j001zs60h9kciae40	cm7uu06ge0010s60hmocr9lu5/X192SK2gTzLbqlvtcQuYOQ==	video/quicktime	cm8j9s9xr001ys60h6eq5osfa	2025-03-21 21:06:02.215
cm8j9z0pm0022s60hvbqc3usq	cm7uu06ge0010s60hmocr9lu5/HIaI/4s5/GWjELQABaBOLQ==	video/quicktime	cm8j9z0ke0021s60he1v3wbhp	2025-03-21 21:11:16.57
cm8rsc2m9000ks60hb9rxvse3	cm8elwpq9002bs60hedm3l2yj/LkB9UYsN2iEKyPfLXdqDcg==	video/mp4	cm8rsc2fi000js60hbt1v6kde	2025-03-27 20:07:28.065
cm8rsu28z000os60hueebo1yf	cm7uu06ge0010s60hmocr9lu5/Y1gq8TLCLeIbc1szKFEUiw==	video/quicktime	cm8rsu22q000ns60h2j9d1gz8	2025-03-27 20:21:27.395
cm8jd25pj002fs60hs9chrak6	cm8etdrpr0022s60ho61sbpqb/IAHfmQlFg2n84ImwoRcvPg==	video/quicktime	cm8jd25jx002es60hgssmv2el	2025-03-21 22:37:41.864
cm8t4dlyw000ks60h7dfhu8sz	cm8n6hq410007s60h9j7ivkby/X2pynG6GC2b+kyHf/OOAow==	video/mp4	cm8t4dlqa000js60hdjh9rsn1	2025-03-28 18:32:21.369
cm8taj0la000ys60hx5ewjs28	cm8iuzb3n0005s60hnmme2v1y/0ISA1Y8+dLVQRRg0kvk65w==	image/png	cm8taj0fv000xs60hx8bsp9pk	2025-03-28 21:24:31.294
cm8xn15f00005s60hmq10f3wp	cm7uu06ge0010s60hmocr9lu5/4VlhFxoW3bMpdoY60RvJaw==	video/quicktime	cm8xn157k0004s60hpp9fgj6g	2025-03-31 22:25:37.453
cm8yk9tao0002s60hywcctpkt	cm864b3pp0000s60huf1fmkg0/CxBCB+3ZfEoU8a4SWjmEkg==	video/quicktime	cm8yk9t2y0001s60hx9jl9osd	2025-04-01 13:56:08.976
cm8je55b1002ss60hp5ihnccg	cm8etdrpr0022s60ho61sbpqb/B/7Snn3lYEUb3z8mP33PMA==	video/mp4	cm8je556p002rs60hip197318	2025-03-21 23:08:00.926
cm8nbj3ah0007s60hoerh677g	cm8emmes1002os60hfgdnrd49/FcVaYzxOLChfSRjyf5yeUA==	video/mp4	cm8nbj3360006s60hwnwhaepy	2025-03-24 17:05:57.354
cm8ni22g2000fs60hkzlj9w5b	cm8ejkqci0017s60h1da0ulse/eh/4O5kpEiJN93+JqbIshw==	video/mp4	cm8ni226s000es60hqug5mcu3	2025-03-24 20:08:40.419
cm8ni3f57000is60hf5tytxiz	cm8ejkqci0017s60h1da0ulse/NH3FLhMZUFOFwaFBQ7neDQ==	video/mp4	cm8ni3f0r000hs60h8ps67p8a	2025-03-24 20:09:43.532
cm8ni4ghc000ls60hiuloxt0s	cm8ejkqci0017s60h1da0ulse/AGmviJ/fxHKEFAcESNT++g==	video/mp4	cm8ni4g9n000ks60hhxgs2m8m	2025-03-24 20:10:31.92
cm8nsm6fr0002s60hu1mw6vqn	cm8ei0oz5000hs60hf1b48fw9/2+6HHkacfuxKgK8PeQy6WQ==	video/quicktime	cm8nsm68p0001s60hd6cq17dr	2025-03-25 01:04:14.871
cm8nw86ba0002s60hnrc2am5s	cm8em6fwr002fs60h69moo9ct/Hku8UDUsUeIJk5MFlZ7wKg==	video/mp4	cm8nw86310001s60hf5vw23p3	2025-03-25 02:45:19.99
cm8ona6n6000ps60hptcglexs	cm8ggdz9b0000s60hm651eb4x/uAq/4+9fM/Ctd0HaU4R11g==	video/quicktime	cm8ona6hw000os60hm4lqulmv	2025-03-25 15:22:43.362
cm8z08u490002s60hycisah3h	cm8okkpn20004s60hi9twmhhm/gb1V3Mdt4/HhpZU1OmTCDA==	video/mp4	cm8z08tx10001s60hmk82o3if	2025-04-01 21:23:17.241
cm8z2ljfp0006s60h82dlgxcs	cm6tpgqwl0000s60hwj4xjow3/HIAO9hNEJndVGKclMeqnGQ==	video/quicktime	cm8z2lj8a0005s60h19fya53c	2025-04-01 22:29:09.158
cm8z6dwff0004s60hra67xly5	cm7yx5dc50000s60hlu2jxmg4/gqSbUeszXVXNTGRhwP8ASg==	video/quicktime	cm8z6dw930003s60h7lv4x57z	2025-04-02 00:15:11.211
cm8z6grx00007s60htibhz56p	cm7yx5dc50000s60hlu2jxmg4/ujGbMDBARIbndege8oB07w==	video/quicktime	cm8z6grrv0006s60hzzkwaf5n	2025-04-02 00:17:25.332
cm8zw9utn0002s60h9x2e8jln	cm8ei2u30000is60hxldwf8tc/Fc8CZaFm2eIcuLhm4ebdwg==	video/mp4	cm8zw9umz0001s60ha5uyvgnv	2025-04-02 12:19:52.523
cm90cfdft0005s60hlfo2abym	cm7uu06ge0010s60hmocr9lu5/hD3uE1tmUbbzOifhaCc4jA==	video/quicktime	cm90cfd770004s60hmxs2mu5p	2025-04-02 19:52:03.786
cm90dguok0008s60hafz7wc19	cm8elt5yz0029s60hc2wwhebn/euLpIE2FzSkWwL6rY8Ai/A==	video/mp4	cm90dguis0007s60hrc85mkbv	2025-04-02 20:21:12.404
cm91funae0002s60hn523dx6z	cm8okkpn20004s60hi9twmhhm/JNt5pK8vQDH4Zx5e2H3aCQ==	video/mp4	cm91fun300001s60hnkljj71s	2025-04-03 14:15:41.414
cm91o3eik0006s60hasvfw4x7	cm8elt5yz0029s60hc2wwhebn/glBPcbmaagnN5OV/uGBJOQ==	video/mp4	cm91o3eby0005s60hu8z13w36	2025-04-03 18:06:26.877
cm91s6cy50002s60hgtvijgfs	cm8ei2u30000is60hxldwf8tc/xDa3k5rS24FYaYvsY2Zetw==	video/quicktime	cm91s6cqj0001s60hotgtv4zu	2025-04-03 20:00:43.277
cm91sd2yi0005s60hel1z576d	cm8ei2u30000is60hxldwf8tc/Pd6xJRyV6gXO/cEwHH2dng==	video/mp4	cm91sd2t80004s60hj71x7r9a	2025-04-03 20:05:56.922
cm91sq77f0008s60hqmezknp5	cm8eo1etv0030s60hwtdzr22r/SLspFOAZ7aATjYj5iXm9GQ==	video/mp4	cm91sq71q0007s60h3b2mrfu8	2025-04-03 20:16:08.956
cm930sjbv0002s60hpahlpv2y	cm7uu06ge0010s60hmocr9lu5/JpmkzgRFLZdGWeVj9IeeQw==	video/quicktime	cm930sj6e0001s60hukd1d96m	2025-04-04 16:49:41.083
cm97fsdfi0002s60h1z9m2m5l	cm7nx40e20005s60hqluumzai/s0d445f+xEQbj3wxYMJc3A==	video/quicktime	cm97fsd8t0001s60h41j39fu5	2025-04-07 19:00:32.382
cm97ft1930005s60hnq6hdj1w	cm7nx40e20005s60hqluumzai/Qw7Rvc5jLOC2A0UbVey5Kw==	video/quicktime	cm97ft13e0004s60hn9qxqbuw	2025-04-07 19:01:03.255
cm97ful8z0008s60hn1sdl4ag	cm7nx40e20005s60hqluumzai/SrtH/VzYwp61hpfKJoeUVA==	video/quicktime	cm97ful3l0007s60hva67wphh	2025-04-07 19:02:15.827
cm98u7n0o0002s60hp5iskxkr	cm8z5x2kb0001s60hw0k73kfa/RoPFDcNd2COPgm3xnCh3oA==	video/mp4	cm98u7mtx0001s60h857lgly7	2025-04-08 18:32:05.449
cm9bg2hag0002s60h6mtf36se	cm7z93nvr0004s60hcxgjwyln/Z24INyYg3zxiD2q/VwLO/Q==	video/mp4	cm9bg2h4b0001s60hd0oa3ccf	2025-04-10 14:19:28.649
cm9bsn7850002s60hdh89m468	cm97eexj40000s60h9oerv3n8/5mXs8Jf9/1+iLe0QPIKLyA==	image/gif	cm9bsn7250001s60h7e9yxh25	2025-04-10 20:11:30.773
cm9hdsxc60003s60hh4grzmzh	cm7uu06ge0010s60hmocr9lu5/lRhQdahis/bHtNtH5wHPhQ==	video/quicktime	cm9hdsx3v0002s60hhoose4wo	2025-04-14 18:02:40.711
cm9inbrz10002s60hsalnbjb2	cm71zq1uu0000s60hsrg9iv1g/ItKvUDPzszf1zwTvITlIbg==	video/quicktime	cm9inbrso0001s60hqj0ggxt8	2025-04-15 15:17:02.941
cm9k1cf2m0002s60hp774m2x8	cm7tp7xd4000gs60h1hu9598i/RzvwYBltZOqhOEm9Rcp1RA==	video/mp4	cm9k1cewy0001s60hluvmtein	2025-04-16 14:37:13.678
cm9k6vnd90002s60hxe199k8i	cm7uu06ge0010s60hmocr9lu5/6OiENgvfEnPuDPzF+Wx7eQ==	video/quicktime	cm9k6vn7f0001s60hqglwd9c2	2025-04-16 17:12:08.974
cm9n58m2p0002s60hf7183jji	cm8ei0oz5000hs60hf1b48fw9/Drp7+QlISOSIDTpeiPlBJg==	video/quicktime	cm9n58lwb0001s60h91omhk59	2025-04-18 18:49:33.121
cm9vegx1x0002s60hgtaxv0on	cm8ei2u30000is60hxldwf8tc/9U+YqiKNzWKHr5NzCWboKw==	video/mp4	cm9vegwv60001s60hd3o4mbmz	2025-04-24 13:30:06.549
cm9x865az0002s60hh7s1ubd1	cm8ekjy21001os60hsk8ue62t/Fq80STyZ1QQsK0sydQN8VA==	video/mp4	cm9x8655g0001s60hih6kg8wx	2025-04-25 20:09:18.683
cma2jgykp0005s60h47fainvw	cm8ei9oo7000ms60hkcdl4q7z/6Ny821u9uidb/+DTsu/zAQ==	video/mp4	cma2jgyfh0004s60hc75iumh6	2025-04-29 13:24:29.834
cma2jib070008s60hat36mall	cm8ei9oo7000ms60hkcdl4q7z/g9PgD/LZeE/RUXxXIPemUQ==	video/mp4	cma2jiatz0007s60htno9u01e	2025-04-29 13:25:32.599
cma2jjgfa000bs60hnprzfdxf	cm8ei9oo7000ms60hkcdl4q7z/TiFIftt0d6mKbaEd/iLtGg==	video/mp4	cma2jjga6000as60hyptiho11	2025-04-29 13:26:26.278
cma2jkh8g000es60huwz90qiz	cm8ei9oo7000ms60hkcdl4q7z/NhItYD+52HHzfeXCmkZWng==	video/mp4	cma2jkgrm000ds60hyv0a09ia	2025-04-29 13:27:13.984
cmacwbohr0004s60h4ssrn6tl	cm8hv4w290000s60huatd0mjt/5r7+nCKWa3iYMy1VGvhk9Q==	video/mp4	cmacwbo5c0003s60h5vkqwbai	2025-05-06 19:22:00.255
cmae2kmjx0002s60hrgzp3cl1	cm7tp7xd4000gs60h1hu9598i/sB0ekg088ilvfIIAah4BDg==	video/mp4	cmae2kmcr0001s60hi437hc2z	2025-05-07 15:04:41.517
cmaec1o750002s60hep7y8yfg	cm7uu06ge0010s60hmocr9lu5/rt8O5byrP4maQKT0NFSyhw==	video/quicktime	cmaec1o110001s60h648ju8j2	2025-05-07 19:29:53.345
cmaeilsky0002s60hs0vw6ynf	cm8f1rww4004cs60h6988nojl/XShhNZn6ZK4Knm3ksSPg6w==	video/quicktime	cmaeilscg0001s60heqxl0q2f	2025-05-07 22:33:29.842
cmal50bel0002s60hzm9sksy7	cm71zq1uu0000s60hsrg9iv1g/BpgWNR3MlWba5fge5CREAg==	video/quicktime	cmal50b5t0001s60h7kihnbfq	2025-05-12 13:47:16.03
cmal51h200005s60hstwv1l4f	cm71zq1uu0000s60hsrg9iv1g/0TGkvL4aivC4UtrjhKN9tg==	video/quicktime	cmal51gwc0004s60hfx9h3vq2	2025-05-12 13:48:10.009
cmampeb8r0002s60hw932xa9k	cm8ei2u30000is60hxldwf8tc/ixbxaU6aA6QiW43bEZ9MwQ==	video/mp4	cmampeb1q0001s60hz864bwoi	2025-05-13 16:05:47.499
cmar2s2j40002s60huanb55ct	cm8ei0oz5000hs60hf1b48fw9/RgV8QCqA8WIyM3vi4ARwQg==	video/mp4	cmar2s2al0001s60h3rom8kvn	2025-05-16 17:31:29.104
cmav4b32v0002s60hzyem0qg9	cm7tp7xd4000gs60h1hu9598i/zccCJdvfTvrlFaPcxzT/yA==	video/mp4	cmav4b2vo0001s60hi307mlri	2025-05-19 13:25:20.599
cmav8qf320003s60hl2ryylwb	cm9a4uiz50000s60h9etzsbuf/ODvEmmUXomtToiMuQiRp1Q==	video/mp4	cmav8qexb0002s60heel4qzss	2025-05-19 15:29:14.462
cmay2w8kh0002s60hfi10ko9v	cm8elt5yz0029s60hc2wwhebn/46incw0P9ixBnCegeoBHzA==	video/mp4	cmay2w8dl0001s60hrpvc0u7j	2025-05-21 15:09:06.785
cmaya0qix0002s60hufvdpycg	cm7yx5dc50000s60hlu2jxmg4/WcL9nk0wwG59URglVQxQEw==	video/quicktime	cmaya0qbe0001s60hve0x07u3	2025-05-21 18:28:33.993
cmb5awex60002s60hqn965kit	cm8el1bj50020s60hty74lkf9/TvpUTnhxwqZCBJmk6nnNgw==	video/mp4	cmb5awep50001s60h86etqtlo	2025-05-26 16:27:35.178
cmbfaj5i10009s60hb7f3ins3	cm8hvl42z0004s60h4v1352m9/N6SdEiQ/KHz+jVB8pvbZmg==	video/webm	cmbfaj5dr0008s60hf4jw6xn6	2025-06-02 16:14:58.201
cmbfjda1b0002s60hgus4gs8h	cm8hvl42z0004s60h4v1352m9/BkvKzUcBL9drbh3btf5g4Q==	video/webm	cmbfjd9w60001s60hmqqfczup	2025-06-02 20:22:20.687
cmbh09w2h0002s60h7gan1ujv	cm8elg2lu0022s60hgrc845md/uz8s6cIaVEJ0dE4f67mBqQ==	image/png	cmbh09vvx0001s60hgz1j0ih0	2025-06-03 21:03:22.265
cmbs167mx0002s60hkkopl6t6	cm8elt5yz0029s60hc2wwhebn/aOuPutNxa/KAdCxE6OMbUQ==	video/quicktime	cmbs167gc0001s60hb9x6avey	2025-06-11 14:13:58.185
cmbtxb48a0002s60h3c5eo9el	cm7uu06ge0010s60hmocr9lu5/CkDwfaW4vaxrGw+vSc2VaA==	video/quicktime	cmbtxb3wl0001s60h4se3xor0	2025-06-12 22:01:20.939
cmbtz60l30002s60h3byzinwr	cm7uu06ge0010s60hmocr9lu5/HHPF6B5xROBl8Ntk3sXsbg==	video/quicktime	cmbtz60fv0001s60hi5uasbk3	2025-06-12 22:53:22.168
cmcc3m9h20002s60h4xzb9wfo	cm7tp7xd4000gs60h1hu9598i//xN9+oLKP3FpYAJ/oB+Kdg==	video/mp4	cmcc3m9a80001s60hxqksyn2v	2025-06-25 15:17:49.815
cmd91ftwb0002s60hhtzqhcu7	cm6thw30g0008s60hkrj1wnge/W0Juqt0hbT94GRYxOJQtxQ==	video/quicktime	cmd91ftrj0001s60heh2yv0q7	2025-07-18 16:33:14.267
cmd9cx9py0002s60h6djk0cig	cm7uu06ge0010s60hmocr9lu5/aruzI2L3jI9fruCKgjJfzQ==	video/quicktime	cmd9cx9ki0001s60hztuvjab2	2025-07-18 21:54:43.702
cmdg8kmy40002s60h1yp5iwz8	cm8egwen60008s60h4d235z20/bAdnN5fgab8jwb/gtPB0Jg==	video/mp4	cmdg8kmrq0001s60hkil6wn71	2025-07-23 17:27:19.084
cmdt2n84t0005s60hcrzetzwe	cmdt2ktmx0002s60hxwxkkzyk/8kpGMgiUpVXV+aIhV7gAZw==	video/mp4	cmdt2n7zd0004s60hzgh3lzsy	2025-08-01 17:02:22.446
cmdt859lo0002s60hot1ychj8	cm7wbitsi000cs60hq1jnj3px/UUJnRPJJ9iqsTK/c7qWeGA==	video/mp4	cmdt859gr0001s60hkiy7duj9	2025-08-01 19:36:22.237
cmdzaa5dq0002s60hi27xm0lu	cm8eo39uq0034s60h5u7p5py4/RjXDTM2tV2/lJAwSoZ4t5A==	video/quicktime	cmdzaa54b0001s60h0e3ono5k	2025-08-06 01:22:46.335
cme1qs6jx0002s60h5ngocnh5	cm8eoqkdb003es60hu6elqii2/dGFP9tm4iVcCcx2f56ibqw==	video/mp4	cme1qs6es0001s60h8n3qh65e	2025-08-07 18:40:13.87
cme2w1g8n0002s60hskabre17	cm8evlg2v003is60hhtx5a0l2/tD8FZXgtPEdW286wot+fLA==	video/mp4	cme2w1g140001s60hqxkdbg22	2025-08-08 13:55:10.584
cme2x9t1r0002s60h2jhooxkq	cm8hfo85u0002s60hrw71e8v4/HRas9O17S/o4g0nvpdUxMQ==	video/quicktime	cme2x9swb0001s60h7uli0ke4	2025-08-08 14:29:40.047
cmeczk83o000ks60hxoy230lo	cm7uzjhwo0001s60ht1tuhtfi/a48dU9CGnchaY8W+z5lsag==	image/gif	cmeczk7y6000js60h9f2hapz1	2025-08-15 15:31:27.108
cmedcg6wk0003s60hxd3lvwzb	cm84lb2sn0000s60hqn6v7ogq/hvEHsBcD2RiDzTB/JKUCKQ==	video/mp4	cmedcg6ry0002s60haalxq9gw	2025-08-15 21:32:13.94
cmek60sfr0002s60hp7lgxk3b	cm8ysolaf0000s60h165ztlk4/foSaC2uvNQVr55KiHxgWPQ==	image/png	cmek60sa30001s60h67qi1tla	2025-08-20 16:06:40.888
cmek61lll0005s60h8jblzozg	cm8ysolaf0000s60h165ztlk4/abZqKLM08V9VepXvPny7yQ==	image/png	cmek61lgx0004s60hh1x7uetv	2025-08-20 16:07:18.681
cmek62j4e0008s60hhw7fpgc4	cm8ysolaf0000s60h165ztlk4/4kbc4pFE8aBMYrzeVtjfPQ==	image/png	cmek62iz80007s60h773yg3o5	2025-08-20 16:08:02.127
cmeu8d51a0002s60hegl7evq6	cm8et181v001qs60hjqt3qupa/cr8O7SDZhVCHGw8gam6tlw==	video/mp4	cmeu8d4vn0001s60h4ff1cbxu	2025-08-27 17:09:58.078
cmeu8g7cv0005s60h7mspvbpw	cm8et181v001qs60hjqt3qupa/TiVTzZG2Vp9/qupTrup2oQ==	video/mp4	cmeu8g7810004s60hgch2qvxw	2025-08-27 17:12:21.056
cmevpg66i0005s60h0r4bjcro	cm8ei2u30000is60hxldwf8tc/4H4AjQd0hpBEZMFPNgzIFQ==	video/mp4	cmevpg6290004s60h4240q55g	2025-08-28 17:55:59.178
cmf349rju0002s60hqujjqdcz	cm8en4hyg002vs60hx2hpkngb/Jg9p5Z04WmAVDpUsE3wDxQ==	video/quicktime	cmf349reg0001s60h9fxl6ie5	2025-09-02 22:25:17.754
cmf3os4mo0002s60hqpv5g4ip	cm7okm0yo0000s60h4d4txvi3/xiTJyrazJX2RBosoSLA7oQ==	video/mp4	cmf3os4gi0001s60hs2tng0t9	2025-09-03 07:59:26.833
cmf4bi1iu0002s60h2cgd4v3z	cmabnm4fs0000s60hiyjquj3k/+RGrm4ilG84d3Ki6xNTKsA==	video/mp4	cmf4bi1d70001s60hrdntg00c	2025-09-03 18:35:27.415
cmf4bpr5d0005s60hq0u2r478	cmabnm4fs0000s60hiyjquj3k/8tWtwotx+Kt4iq5ngLdrbA==	video/mp4	cmf4bpqz40004s60h1gij2msr	2025-09-03 18:41:27.217
cmf5si9ev0002s60h4t2e4iuc	cm7uz8qc20000s60had0ae7rt/GHqE70XDdlS1demwvXvrew==	video/mp4	cmf5si9920001s60hco072mp6	2025-09-04 19:19:17.287
cmfbas8du0002s60hwwnpny28	cm8hfo85u0002s60hrw71e8v4/NbGheWTEAKMPY205OenM3w==	video/quicktime	cmfbas86y0001s60h7minjxjo	2025-09-08 15:49:46.482
cmfcxg7sg0002s60hglyhqu3a	cm7uzjhwo0001s60ht1tuhtfi/rTsAi1K+dmBcgjGb4M6lkw==	image/png	cmfcxg7mn0001s60hlalsrbsa	2025-09-09 19:12:03.184
cmfcxl6lc0005s60hqxf9mbd6	cm7uzjhwo0001s60ht1tuhtfi/9us8SqXPSJwdYC1MAUePUw==	image/png	cmfcxl6gp0004s60h7q3tnx0m	2025-09-09 19:15:54.913
cmffg7dl90004s60h2y72jn7x	cm8ej63t6000ss60h99hkq1b2/vLap49DJ0Tr1Bg9sXfkCcw==	video/mp4	cmffg7dfl0003s60h4vkahml5	2025-09-11 13:32:35.854
cmfhdoe4w0002s60hyvz6h2ao	cm8erozd20005s60h3n1u3taw/wLFWZAoKRLBhtnvZrooNAA==	video/quicktime	cmfhdodz70001s60h2i0ylpvc	2025-09-12 21:57:23.216
cmfl3v2i50003s60hor2bwarg	cm8ei2u30000is60hxldwf8tc/jjq/PwqQMkGEgLFOfqHbnQ==	video/mp4	cmfl3v29f0002s60h7w9rbtcg	2025-09-15 12:33:43.277
cmflcf34f0005s60h6n5d4fgu	cm8erozd20005s60h3n1u3taw/9EfJwbj/u7UeiKM5g8k0MQ==	video/quicktime	cmflcf2z80004s60h2nwxlt1e	2025-09-15 16:33:14.127
cmflcoea8000bs60hn8jl4fg5	cm8erozd20005s60h3n1u3taw/PP+oSg+OKVpKEbSaLyzrmA==	video/quicktime	cmflcoe63000as60hg99z4iyh	2025-09-15 16:40:28.496
cmflcy6vv000es60hfyda9x82	cm8erozd20005s60h3n1u3taw/h1/G++xYsHLm35VY9Xh14A==	video/quicktime	cmflcy6q9000ds60hwg4bl937	2025-09-15 16:48:05.467
cmfybonlp0002s60hz6onfg4j	cm8ei0oz5000hs60hf1b48fw9/7PfGYtc6vJTl0iYv14oarg==	video/mp4	cmfyboneh0001s60h4d50jd6u	2025-09-24 18:33:41.245
cmfydx5lp0002s60h6pddcm43	cm7z93nvr0004s60hcxgjwyln/4Qsy1jco2+/6O8w22M4a0g==	video/quicktime	cmfydx5h40001s60hz4338212	2025-09-24 19:36:17.053
cmg0zrotg0004s60h1xdyzln9	cm8nk5rtq0002s60harmh7mlq/Pkl3q9326UDVC2LLiKpd8w==	image/png	cmg0zroof0003s60hplc820tk	2025-09-26 15:23:25.924
cmg0zrou40005s60hy597g6nj	cm8nk5rtq0002s60harmh7mlq/+w7jEw+WAKxIVmUm4gdMYA==	video/mp4	cmg0zroof0003s60hplc820tk	2025-09-26 15:23:25.948
cmg1894b70003s60hwx5rir2t	cm71zq1uu0000s60hsrg9iv1g/aKbWO0XyHzh8bwa9nTRrig==	video/quicktime	cmg18944j0002s60hckylh1qm	2025-09-26 19:20:56.083
cmg1bbynq0002s60h683rfnnp	cm7uzjhwo0001s60ht1tuhtfi/nCDFvdIvDIq/EZFHe90spw==	image/gif	cmg1bbyik0001s60h1hy9nswr	2025-09-26 20:47:07.575
cmg6q85r10002s60hozr4o0jm	cm7uzjhwo0001s60ht1tuhtfi/4a2+8D6Q13aqtlTp+40JvQ==	image/png	cmg6q85kt0001s60hfv8marde	2025-09-30 15:42:55.261
cmg6r3clg0002s60hqv5um1ju	cm7uzjhwo0001s60ht1tuhtfi/j8YJvbTlxcoHXO5KVzgYkg==	image/png	cmg6r3cgo0001s60hoisqqluf	2025-09-30 16:07:10.468
cmg70bj7m0005s60h8cdjbafv	cm7uzjhwo0001s60ht1tuhtfi/rrXgkhlOwL1ywxm3oPsWqQ==	image/gif	cmg70bj390004s60hx69d4izx	2025-09-30 20:25:28.834
cmg882jkj0005s60hpmuoi709	cm8okkpn20004s60hi9twmhhm/PSfOO4F6A85VcB5Ngzfu0A==	video/mp4	cmg882jfo0004s60h4srue915	2025-10-01 16:50:12.499
cmg8dvfc50002s60h2augdfni	cm8okkpn20004s60hi9twmhhm/Bo1F0ZMtS9ZMR1y8lvyaog==	video/mp4	cmg8dvf7l0001s60hjyo18kqg	2025-10-01 19:32:38.117
cmg9lr5550002s60hz5s7h8fq	cm7uzjhwo0001s60ht1tuhtfi/Fw5nU1bN2UML/6kIZxHHzw==	image/gif	cmg9lr4yl0001s60h92wgd567	2025-10-02 16:01:01.386
cmgb7t1ju0002s60hxs54td1d	cm8ysolaf0000s60h165ztlk4/k0H7hp3pAny+UVSboreERg==	image/png	cmgb7t1e60001s60h8m7ligqn	2025-10-03 19:06:07.771
cmgedo4s30002s60h5f4byfyn	cm8esf3rq000ys60hv7l3k2vy/tOjnAkwTlwJ8DvAtexK+zg==	video/mp4	cmgedo4k40001s60hqgup0t3m	2025-10-06 00:13:34.899
cmgej2zog0002s60h9g7dmdqh	cm6thw30g0008s60hkrj1wnge/sHzIB86Bl13vknDeSF6IDA==	video/mp4	cmgej2zjp0001s60hvlykl7o0	2025-10-06 02:45:06.208
cmgfe600a0002s60hr7r0zl24	cm8esf3rq000ys60hv7l3k2vy/yWn5u5pMhRws0sxE1u9ybQ==	video/mp4	cmgfe5zup0001s60h2t97wg7m	2025-10-06 17:15:14.698
cmgfo4abq0002s60hyid9wv2r	cm7uzjhwo0001s60ht1tuhtfi/752KCdEiN5MfiIT5uTBu8A==	image/png	cmgfo4a6y0001s60htvruu214	2025-10-06 21:53:50.918
cmgfygppj0005s60hmo6cm5ee	cm8em7a7t002hs60hx8lnfgo3/dFO9Yc9ULg7JCoF6jGtDmQ==	video/mp4	cmgfygpkg0004s60ht8kppm99	2025-10-07 02:43:26.887
cmggsyyb50002s60h64393vf0	cm8ggdz9b0000s60hm651eb4x/ZtNxbxjOQtD+VuTjNckBRQ==	video/quicktime	cmggsyy5l0001s60hym6xirns	2025-10-07 16:57:26.321
cmgl55qvs0002s60hhwbotds4	cm8et181v001qs60hjqt3qupa/pofXgRFsYBY9U60n20ShEw==	image/gif	cmgl55qqj0001s60hdqq0ninn	2025-10-10 17:49:43.384
cmgux7d430002s60hwyk9jthe	cm7uzjhwo0001s60ht1tuhtfi/zFzVfnyHhPBYUlcZYiYkSA==	image/gif	cmgux7cyu0001s60hzohk2k7w	2025-10-17 14:04:43.684
cmh2ajgdd0002s60h77sj09mb	cm7zc3ylp0000s60hpc7gtlbl/HMgA+WdT1TgwykLqU0qxng==	video/mp4	cmh2ajg7k0001s60hstsxspk6	2025-10-22 17:52:26.018
cmh54bquh0002s60hkaychmcm	cm8egwen60008s60h4d235z20/B346V4EdSFbjD80Tc0n4WQ==	video/quicktime	cmh54bqp60001s60hnosq5yan	2025-10-24 17:21:47.177
cmhf7m2az0002s60h8anosv1d	cm84lb2sn0000s60hqn6v7ogq/AkQDdX40J+QVsYha4UxKVw==	video/mp4	cmhf7m24y0001s60hrsx719eq	2025-10-31 18:51:29.196
cmhp938rw0002s60h9dkwv0ij	cm6tpgqwl0000s60hwj4xjow3/mmmsDqp1FNzErrvmgP4kPw==	video/quicktime	cmhp938m40001s60hms7gable	2025-11-07 19:30:32.108
cmhpae9iu0005s60hqt5hsmr1	cm8ei0oz5000hs60hf1b48fw9/ly5B7+bNSrcLOeMwVBldSw==	video/mp4	cmhpae9eb0004s60h21xxu4ga	2025-11-07 20:07:05.91
cmhpbi3e10008s60hvw1pid9m	cm6tpgqwl0000s60hwj4xjow3/a+dlY5m7w5+ReQHllYDovg==	video/mp4	cmhpbi38n0007s60hytg3wrny	2025-11-07 20:38:04.202
cmhpbqie1000cs60hyzafi4fw	cm6tpgqwl0000s60hwj4xjow3/XGDnn3qokKRIn3/cCCUirQ==	video/quicktime	cmhpbqi9q000bs60h4hi483hh	2025-11-07 20:44:36.889
cmhuw71vs0002s60h5iim03nr	cm8et181v001qs60hjqt3qupa/V4NW9GWpcEd11I/Sv4q0fA==	video/mp4	cmhuw71ql0001s60h2r1nyhhs	2025-11-11 18:16:11.848
cmhw4ynja0003s60hlo0h4fnd	cmf2s9kxe0003s60hq1y96kpr/xlZOl0xdIb732JOMoI0Dmw==	video/mp4	cmhw4yndr0002s60he934ze00	2025-11-12 15:09:22.726
cmi6668rn0002s60hq9s2yq00	cmg17bxfr0000s60hzi42vlms/XNmSfXtSVNO+ErckP4Udqg==	image/png	cmi6668m60001s60hgo813zoh	2025-11-19 15:40:58.212
cmi7sd0o50002s60hrn30nmdr	cm8em7a7t002hs60hx8lnfgo3/G1aeZuIHq4EubxjinJqqsw==	video/mp4	cmi7sd0iv0001s60hsntwbtq0	2025-11-20 18:49:52.037
cmi7sktf50008s60h3ceqn33z	cm8eozabi003hs60hwv83es2p/eU+4dIJfW6ZM/aMwGyadTA==	video/mp4	cmi7skt9w0007s60hk95nw83t	2025-11-20 18:55:55.89
cmi8zm28w0002s60hljj2bmx5	cmd4nbvn20000s60h66347bvf/PmNbA5cCxWKOnvlQUcY8Jw==	image/gif	cmi8zm22r0001s60hx56xvxn0	2025-11-21 15:00:37.472
cmi92liis0007s60hb325ankr	cm7wbitsi000cs60hq1jnj3px/n7i+VeLDQtn2BLHS92gr6g==	video/mp4	cmi92lie70006s60hy02feujs	2025-11-21 16:24:10.756
cmi92lzzp000cs60howur3kr1	cm7wbitsi000cs60hq1jnj3px/F7PmOKaHfLbwTDv7vDSgeg==	video/mp4	cmi92lzvr000bs60hw9cbvslh	2025-11-21 16:24:33.397
cmi93rzyw000ps60h75ou8gi6	cm7wbitsi000cs60hq1jnj3px/FH5S+zSTFoVIaTksu+y3MA==	video/mp4	cmi93rzud000os60hmjnnhuye	2025-11-21 16:57:12.92
cmi96me97000ts60hfmde8o4q	cmebutsfu0034s60h71p4l2gj/Qz0Z+segBV92x/tGNmGK8A==	video/mp4	cmi96me3o000ss60hxrpchl63	2025-11-21 18:16:50.348
cmi9dhlr20002s60h2jgp8byp	cm7z93nvr0004s60hcxgjwyln/iYjQntONLKw6gjVarzBZtw==	video/quicktime	cmi9dhlm80001s60hsmhtxfx8	2025-11-21 21:29:04.095
cmi9dl2t10008s60hlglkyt64	cmabnm4fs0000s60hiyjquj3k/EwaPw2e2M+D9NExk9j8xpQ==	image/jpeg	cmi9dl2nu0007s60h6y14vi4b	2025-11-21 21:31:46.165
cmidos12g0002s60hzk9ihfuj	cm8epbkwd003qs60h1nfu93ph/9GfJMCGTUYKtDsCYSB242Q==	video/mp4	cmidos0vw0001s60h34223uol	2025-11-24 21:56:10.985
\.


--
-- Data for Name: PinnedTag; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PinnedTag" (id, tag) FROM stdin;
cm8iw8p2i000vs60h7mc3i51u	admin
cm8iw8p2i000ws60hilu5v924	msb
cm8iw8p2i000xs60h5oqjwz4b	origami
cm8iw8p2i000ys60hc2cq60oz	shop
cm8iw8p2i000zs60h0bivxuc7	storefront
cm8iw8p2i0010s60hc7x0ewet	growth
\.


--
-- Data for Name: Post; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Post" (id, "authorId", title, description, tags, reactions, "createdAt", "updatedAt", mentions) FROM stdin;
cm7uvtrif000zs60hdsghppzr	cm71zq1uu0000s60hsrg9iv1g	\N	Fun with transitions #shop #origami	{shop,origami}	{"😍": ["cm8ejbj6l000ys60h8f353fxd"]}	2025-03-04 19:28:48.52	2025-03-04 19:28:48.52	[]
cm7uxh7mr0007s60hyf22h24l	cm6zewlv30000s60hiwupvnso	\N	Homepage creation on the Mini Store Builder.	{}	{"😍": ["cm6tpgqwl0000s60hwj4xjow3", "cm8ejbj6l000ys60h8f353fxd"]}	2025-03-04 20:15:02.116	2025-03-04 20:15:02.116	[]
cm7utlp61000ys60hfc4jw1r3	cm7tp7xd4000gs60h1hu9598i	\N	Just a humble little hover state	{}	{"😍": ["cm6tofeoq0000s60htca0gvcm", "cm8euq4qf003ds60hq9zfiwi8"]}	2025-03-04 18:26:33.001	2025-03-04 18:26:33.001	[]
cm7uouiha0001s60hlbtag2ni	cm7nm6s9j0000s60hxxf8hx4i	\N	inline delete	{}	{"😍": ["cm8ei2u30000is60hxldwf8tc"]}	2025-03-04 16:13:26.158	2025-03-04 16:13:26.158	[]
cm7ul9fng0001s60hvttd8ctz	cm7nm6s9j0000s60hxxf8hx4i	\N	Inline export	{}	{"😍": ["cm7tp7xd4000gs60h1hu9598i", "cm8ei2u30000is60hxldwf8tc"], "🤔": []}	2025-03-04 14:33:03.868	2025-03-04 14:33:03.868	[]
cm7uodej30004s60hgphhth8l	cm7tp7xd4000gs60h1hu9598i	\N	Thinking about breaking our teeny tiny responsive grid inside Admin 🤔	{}	{"😍": ["cm8ei2u30000is60hxldwf8tc", "cm8egfasb0000s60h8emeqkln"]}	2025-03-04 16:00:07.888	2025-03-04 16:00:07.888	[]
cm7uwg0r90018s60hw22le3q7	cm7uu06ge0010s60hmocr9lu5	\N	Shop App - Edit collection flow	{}	{"😍": ["cm7nm6s9j0000s60hxxf8hx4i", "cm6tpgqwl0000s60hwj4xjow3", "cm71zq1uu0000s60hsrg9iv1g"]}	2025-03-04 19:46:06.933	2025-03-04 19:46:06.933	[]
cm7uvayht0001s60hs226e8tj	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Avatar capture flow	{}	{"😍": ["cmaztncpn0000s60h4qitcgto"]}	2025-03-04 19:14:11.105	2025-03-04 19:14:11.105	[]
cm7us8yra0001s60hlb2u1hje	cm7nm6s9j0000s60hxxf8hx4i	\N	Variant selectors	{}	{"😍": ["cm8stdbcz0000s60hfqbddj7t"]}	2025-03-04 17:48:39.286	2025-03-04 17:48:39.286	[]
cm7utf7lz000ss60hble5gyvi	cm7nm6s9j0000s60hxxf8hx4i	\N	Edit quantity in cart animation	{}	{"😍": ["cm8stdbcz0000s60hfqbddj7t"]}	2025-03-04 18:21:30.311	2025-03-04 18:21:30.311	[]
cmacwbo5c0003s60h5vkqwbai	cm8hv4w290000s60huatd0mjt	\N	Faster and more powerful cart editing in POS	{}	{"😍": ["cm8ga0f7c0001s60hyzrr3mpz", "cm8onbupz000qs60hq5d3mdiz", "cm9wigff80000s60hgynx5c87"], "🤔": []}	2025-05-06 19:21:59.808	2025-05-06 19:21:59.808	[]
cm7usao9p000as60h4kx0w6qt	cm7nm6s9j0000s60hxxf8hx4i	\N	Add to cart sequential animation	{}	{"😍": ["cm6tpgqwl0000s60hwj4xjow3", "cm8stdbcz0000s60hfqbddj7t", "cm8ru7ucd0003s60hm5kqwdqq"]}	2025-03-04 17:49:59.005	2025-03-04 17:49:59.005	[]
cm7ukgy530007s60h5zfwfqbq	cm7okm0yo0000s60h4d4txvi3	\N	Riffing on #Shop email recognition on Customer accounts	{Shop}	{"😍": ["cm9tyb4ci0000s60hl6o3vv62"]}	2025-03-04 14:10:54.808	2025-03-04 14:10:54.808	[]
cm7ukffwb0004s60hoykm17h1	cm7okm0yo0000s60h4d4txvi3	\N	Interacting with your account in the new Sign In with #Shop windoid	{Shop}	{"😍": ["cm9tyb4ci0000s60hl6o3vv62"]}	2025-03-04 14:09:44.508	2025-03-04 14:09:44.508	[]
cm7ukea4h0001s60h67zd4qv5	cm7okm0yo0000s60h4d4txvi3	\N	New OTP success state #shop	{shop}	{"😍": ["cm7nm6s9j0000s60hxxf8hx4i", "cm9tyb4ci0000s60hl6o3vv62"]}	2025-03-04 14:08:50.369	2025-03-04 14:08:50.369	[]
cm7o0acjl0001s60h0u4i93eg	cm6thw30g0008s60hkrj1wnge	\N	#shop Collab with Jake Archibald on "under checkout" 	{shop}	{"😍": ["cm6thw30g0008s60hkrj1wnge"]}	2025-02-27 23:59:17.505	2025-02-27 23:59:17.505	[]
cmg6r3cgo0001s60hoisqqluf	cm7uzjhwo0001s60ht1tuhtfi	\N	purchase rate widget 	{}	{}	2025-09-30 16:07:10.296	2025-09-30 16:07:10.296	[]
cm7uv4am70004s60h5s1sqk37	cm7nx40e20005s60hqluumzai	\N	Superfeed™ on Shop	{}	{"😍": ["cm7nx40e20005s60hqluumzai"]}	2025-03-04 19:09:00.223	2025-03-04 19:09:00.223	[]
cm7tkj5x00001s60hw0u7mjmg	cm7thki660000s60hlrru9mhx	\N	Are we letting non-product things in here too?	{}	{"😍": ["cm6tofeoq0000s60htca0gvcm", "cm6zewlv30000s60hiwupvnso", "cm7tp7xd4000gs60h1hu9598i"]}	2025-03-03 21:24:52.02	2025-03-03 21:24:52.02	[]
cm7uso8u2000gs60h25ogqyrj	cm7nm6s9j0000s60hxxf8hx4i	\N	Inline modal animation	{}	{}	2025-03-04 18:00:32.186	2025-03-04 18:00:32.186	[]
cm7uvb7h40004s60hv150poaz	cm7nx40e20005s60hqluumzai	\N	Minis: Merchant Polls and Tolstoy Shoppable Video	{}	{}	2025-03-04 19:14:22.745	2025-03-04 19:14:22.745	[]
cm7uwa1nc0012s60hx9pge64v	cm7uu06ge0010s60hmocr9lu5	\N	Shop App - Create Collection flow	{}	{}	2025-03-04 19:41:28.152	2025-03-04 19:41:28.152	[]
cm7uwdj9f0015s60holtk67gg	cm7uu06ge0010s60hmocr9lu5	\N	Shop App - Add to collection flow	{}	{}	2025-03-04 19:44:10.948	2025-03-04 19:44:10.948	[]
cm7uvget8000ds60hdwkth9xm	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Avatar share flow	{}	{}	2025-03-04 19:18:25.532	2025-03-04 19:18:25.532	[]
cm7uvlew0000ts60hgniec6q0	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Color Season analyzer animation  	{}	{}	2025-03-04 19:22:18.912	2025-03-04 19:22:18.912	[]
cm7uwlojp001bs60h2g3mbgr4	cm7uu06ge0010s60hmocr9lu5	\N	Shop App - Virtual Try-on concept	{}	{}	2025-03-04 19:50:31.046	2025-03-04 19:50:31.046	[]
cm7uwu1vf001es60hf1ky4vhh	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Motion exploration 	{}	{"😍": ["cm6tpgqwl0000s60hwj4xjow3"]}	2025-03-04 19:57:01.564	2025-03-04 19:57:01.564	[]
cm7uvk2id000ps60hiheaq4pp	cm71zq1uu0000s60hsrg9iv1g	\N	Initial #origami prototype of a store redesign we shipped in #shop at the end of last year	{origami,shop}	{"😍": ["cm71zq1uu0000s60hsrg9iv1g"]}	2025-03-04 19:21:16.213	2025-03-04 19:21:16.213	[]
cm7uvfdgt000as60hcnr2xplx	cm7nx40e20005s60hqluumzai	\N	Creator content on Shop	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5"]}	2025-03-04 19:17:37.133	2025-03-04 19:17:37.133	[]
cm7uvpubv000ws60hanahf68l	cm71zq1uu0000s60hsrg9iv1g	\N	#shop cash - first time animation	{shop}	{"😍": ["cm71zq1uu0000s60hsrg9iv1g"]}	2025-03-04 19:25:45.547	2025-03-04 19:25:45.547	[]
cm7uvk1tt000ms60hj8oqnx3f	cm7nx40e20005s60hqluumzai	\N	Morphing Modals	{}	{"😍": ["cm71zq1uu0000s60hsrg9iv1g"]}	2025-03-04 19:21:15.33	2025-03-04 19:21:15.33	[]
cm7uu1a8j0012s60hj6syajw8	cm7tp7xd4000gs60h1hu9598i	\N	Explorations of a declarative PDP	{}	{"😍": ["cm71zq1uu0000s60hsrg9iv1g"]}	2025-03-04 18:38:40.148	2025-03-04 18:38:40.148	[]
cm7uvib4p000gs60h83y0rcxv	cm7nx40e20005s60hqluumzai	\N	Shop Stories	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5"]}	2025-03-04 19:19:54.073	2025-03-04 19:19:54.073	[]
cm7uvcikp0001s60hoa3su9eh	cm7nx40e20005s60hqluumzai	\N	Collabs Composer	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5"]}	2025-03-04 19:15:23.785	2025-03-04 19:15:23.785	[]
cm7uvdjbt0004s60hsee3h5k9	cm7nx40e20005s60hqluumzai	\N	Shop Drops: Enter the Drop! 	{}	{"😍": ["cm6thw30g0008s60hkrj1wnge", "cm7uu06ge0010s60hmocr9lu5"]}	2025-03-04 19:16:11.417	2025-03-04 19:16:11.417	[]
cm7uwz9w10001s60hh2vp7h4w	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Avatar exploration	{}	{"😍": ["cm7nm6s9j0000s60hxxf8hx4i", "cm6thw30g0008s60hkrj1wnge", "cm6tpgqwl0000s60hwj4xjow3", "cm6zewlv30000s60hiwupvnso", "cm71zq1uu0000s60hsrg9iv1g"]}	2025-03-04 20:01:05.233	2025-03-04 20:01:05.233	[]
cm7wa8dvu0001s60hnmjdvf2v	cm7uu06ge0010s60hmocr9lu5	\N	Shop App - Avatar loading exploration	{}	{"😍": ["cm7whzxin000fs60hky65yi4a", "cm7uzjhwo0001s60ht1tuhtfi", "cm7tp7xd4000gs60h1hu9598i", "cm8z0r4yx0003s60ha7qrmr58", "cm6zewlv30000s60hiwupvnso"]}	2025-03-05 18:59:51.498	2025-03-05 18:59:51.498	[]
cm7uyb2z0000ks60hmdec8d3r	cm6zewlv30000s60hiwupvnso	\N	Photo editing on Mini Store Builder.	{}	{"😍": ["cm6tpgqwl0000s60hwj4xjow3", "cm7uzjhwo0001s60ht1tuhtfi", "cm8ejbj6l000ys60h8f353fxd", "cm6zjpx940000s60h8whb0img", "cm8esof46001cs60hm8sbabdj"]}	2025-03-04 20:38:15.757	2025-03-04 20:38:15.757	[]
cm7v98wiu0004s60hkrzq4t4j	cm7thki660000s60hlrru9mhx	\N	Quick hardware render mockup for showing the Studio site #render #mockup	{render,mockup}	{"😍": ["cm6thw30g0008s60hkrj1wnge", "cm7thki660000s60hlrru9mhx", "cm6zjpx940000s60h8whb0img"]}	2025-03-05 01:44:29.862	2025-03-05 01:44:29.862	[]
cm7waeowe0007s60h18k6rzg4	cm71zq1uu0000s60hsrg9iv1g	\N	Morph sheet to fullscreen view. #shop #origami	{shop,origami}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm7uzjhwo0001s60ht1tuhtfi", "cm6thw30g0008s60hkrj1wnge"]}	2025-03-05 19:04:45.71	2025-03-05 19:04:45.71	[]
cm7uyexk9000ns60heh3q29i5	cm6zewlv30000s60hiwupvnso	\N	Exploration for Community tab (Challenges) on Mini Store Builder.	{}	{"😍": ["cm7tp7xd4000gs60h1hu9598i", "cm7uu06ge0010s60hmocr9lu5", "cm8ejbj6l000ys60h8f353fxd", "cm8esof46001cs60hm8sbabdj", "cm7oyhrpy0000s60hp7oifrws", "cm8iv1f4o0006s60hbu5l5lhs", "cm8egfasb0000s60h8emeqkln"], "🤔": []}	2025-03-04 20:41:15.369	2025-03-04 20:41:15.369	[]
cm7wc8dh30001s60hvx2pqvrf	cm71zq1uu0000s60hsrg9iv1g	\N	Dreamboard mini #shop	{shop}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm7thki660000s60hlrru9mhx", "cm7uzjhwo0001s60ht1tuhtfi", "cm7z93nvr0004s60hcxgjwyln"]}	2025-03-05 19:55:50.199	2025-03-05 19:55:50.199	[]
cm7uxdgl70004s60htfjdkuu7	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Carousel exploration	{}	{"😍": ["cm6zewlv30000s60hiwupvnso", "cm6tpgqwl0000s60hwj4xjow3"]}	2025-03-04 20:12:07.099	2025-03-04 20:12:07.099	[]
cm7v0agxa0007s60hb3j6gs65	cm71zq1uu0000s60hsrg9iv1g	\N	Add products to prompt for deep research concept. #shop	{shop}	{"😍": ["cm7v30c2f0000s60h6z1za6xh", "cm7thki660000s60hlrru9mhx", "cm7uu06ge0010s60hmocr9lu5"]}	2025-03-04 21:33:46.414	2025-03-04 21:33:46.414	[]
cm7uviiwu000js60hgzwq30bq	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Color Season Feed Card	{}	{"😍": ["cm6tpgqwl0000s60hwj4xjow3", "cm6zewlv30000s60hiwupvnso"]}	2025-03-04 19:20:04.158	2025-03-04 19:20:04.158	[]
cm7whtol2000as60halg7wpm9	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Exploring transition sates for renters that can take up to 5s	{}	{"😍": ["cm7whzxin000fs60hky65yi4a", "cm7w5b1un0007s60hy1nce386", "cm7w6ijj1000as60hsdoavuck", "cm7uzjhwo0001s60ht1tuhtfi", "cm6tofeoq0000s60htca0gvcm", "cm7z9jt6f000as60ha21r1psy", "cm7lyry250000s60hl4e0yfts", "cm83u3z1z0000s60hvbzqic4w"]}	2025-03-05 22:32:22.454	2025-03-05 22:32:22.454	[]
cm7uxr4fn000ds60h52jkajem	cm6zewlv30000s60hiwupvnso	\N	Price calculator for Mini Store Builder	{}	{"😍": ["cm8ejbj6l000ys60h8f353fxd", "cm7oyhrpy0000s60hp7oifrws"]}	2025-03-04 20:22:44.532	2025-03-04 20:22:44.532	[]
cm7wgl5640001s60hp74l7kv5	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Fit Closet transition exploration\n\n#shop #shopmini	{shop,shopmini}	{"😍": ["cm7v5oid90000s60hen2v9rg2", "cm8hm62380000s60hdm8kycpv"], "🤔": []}	2025-03-05 21:57:44.428	2025-03-05 21:57:44.428	[]
cm7v06i3i0004s60hrx2pj8cv	cm71zq1uu0000s60hsrg9iv1g	\N	Old wild cart interaction prototype #shop #origami\n	{shop,origami}	{}	2025-03-04 21:30:41.31	2025-03-04 21:30:41.31	[]
cm7uyak1n000hs60hs1bjsz6z	cm6zewlv30000s60hiwupvnso	\N	Theme editing on Mini Store Builder	{}	{"😍": ["cm71zq1uu0000s60hsrg9iv1g", "cm8ejbj6l000ys60h8f353fxd", "cm7oyhrpy0000s60hp7oifrws"]}	2025-03-04 20:37:51.227	2025-03-04 20:37:51.227	[]
cmg8dvf7l0001s60hjyo18kqg	cm8okkpn20004s60hi9twmhhm	\N	#BDS #BrandDesignStudio	{BDS,BrandDesignStudio}	{"😍": ["cm8el1bj50020s60hty74lkf9"]}	2025-10-01 19:32:37.953	2025-10-01 19:32:37.953	[]
cm7v05hfv0001s60hq0hk21zo	cm71zq1uu0000s60hsrg9iv1g	\N	Next step for cart in Shop—morph to checkout. #shop #origami\n	{shop,origami}	{"😍": ["cm6zewlv30000s60hiwupvnso", "cm7uu06ge0010s60hmocr9lu5"]}	2025-03-04 21:29:53.803	2025-03-04 21:29:53.803	[]
cm7uxlkh6000as60hmjf7xn1r	cm6zewlv30000s60hiwupvnso	\N	Title generating.	{}	{"😍": ["cm8ejbj6l000ys60h8f353fxd", "cm7oyhrpy0000s60hp7oifrws"]}	2025-03-04 20:18:25.386	2025-03-04 20:18:25.386	[]
cm7zdmh0x0007s60hlydi70bn	cm7yx5dc50000s60hlu2jxmg4	\N	Dreamboard 	{}	{"😍": ["cm7nx40e20005s60hqluumzai", "cm7lyry250000s60hl4e0yfts", "cm7uu06ge0010s60hmocr9lu5", "cm7yx5dc50000s60hlu2jxmg4", "cm8eqiaqa0004s60h5jnuu2om", "cm8epnfd5003ts60hi0ngdkga", "cm8eo58zt0036s60ht4c3mf3x", "cm8hm62380000s60hdm8kycpv"]}	2025-03-07 22:58:06.13	2025-03-07 22:58:06.13	[]
cm7v1yy0h0001s60hzorcxbo0	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Avatar feed concept	{}	{"😍": ["cm6zewlv30000s60hiwupvnso", "cm7w5b1un0007s60hy1nce386", "cm7z9jt6f000as60ha21r1psy"], "🤔": ["cm7nx40e20005s60hqluumzai", "cm71zq1uu0000s60hsrg9iv1g"]}	2025-03-04 22:20:47.921	2025-03-04 22:20:47.921	[]
cmek60sa30001s60h67qi1tla	cm8ysolaf0000s60h165ztlk4	\N	Plus differentiation — Admin, desktop	{}	{}	2025-08-20 16:06:40.683	2025-08-20 16:06:40.683	[]
cm7w1j7ta0001s60h6u4cvz22	cm7uu06ge0010s60hmocr9lu5	\N	Shop App - Loading animation exploration\n\n#shop #motion	{shop,motion}	{"😍": ["cm7w5b1un0007s60hy1nce386"]}	2025-03-05 14:56:20.302	2025-03-05 14:56:20.302	[]
cm7vu64d70001s60hq66p7i9k	cm7nx40e20005s60hqluumzai	\N	New search paradigms :) 	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm7nx40e20005s60hqluumzai"], "🤔": ["cm71zq1uu0000s60hsrg9iv1g", "cm6thw30g0008s60hkrj1wnge"]}	2025-03-05 11:30:11.995	2025-03-05 11:30:11.995	[]
cmhf7m24y0001s60hrsx719eq	cm84lb2sn0000s60hqn6v7ogq	\N	Analytics line chart concept\n\nhttps://chart-exp.quick.shopify.io/	{}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9"]}	2025-10-31 18:51:28.978	2025-10-31 18:51:28.978	[]
cm7uv7orb0007s60hb3j0qdgm	cm7nx40e20005s60hqluumzai	\N	Cash Wallet on Shop	{}	{"😍": ["cm6tpgqwl0000s60hwj4xjow3", "cm7nx40e20005s60hqluumzai", "cm7uu06ge0010s60hmocr9lu5"]}	2025-03-04 19:11:38.519	2025-03-04 19:11:38.519	[]
cm7utcdwt000ps60h60t2xytj	cm7nm6s9j0000s60hxxf8hx4i	\N	Delete pop!	{}	{"😍": ["cm8stdbcz0000s60hfqbddj7t", "cm8ru7ucd0003s60hm5kqwdqq"]}	2025-03-04 18:19:18.509	2025-03-04 18:19:18.509	[]
cmf5si9920001s60hco072mp6	cm7uz8qc20000s60had0ae7rt	\N	Simplified Shop Campaigns creation	{}	{"😍": ["cm9tyb4ci0000s60hl6o3vv62", "cm8or5deb001bs60hsjg54hrx", "cm8ixpljw001es60hqdbihh7p"]}	2025-09-04 19:19:17.078	2025-09-04 19:19:17.078	[]
cm83kpw670001s60h24lrp5gx	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Merch Mini concept	{}	{"😍": ["cm83u3z1z0000s60hvbzqic4w", "cm6thw30g0008s60hkrj1wnge", "cm8ejcicz000zs60hjy10f6j3", "cm8ekjy21001os60hsk8ue62t", "cm8eqiaqa0004s60h5jnuu2om", "cm6zjpx940000s60h8whb0img", "cm8g5dsmz000ts60hk4913ehy"]}	2025-03-10 21:27:47.743	2025-03-10 21:27:47.743	[]
cm7zc7m5w0002s60howj4gftu	cm7zc3ylp0000s60hpc7gtlbl	\N	Segmentation editor	{}	{"😍": ["cm7xvkve80003s60hi7nmelq4", "cm7z9l7jf000bs60hg2j29tcc", "cm84lb2sn0000s60hqn6v7ogq", "cm8eiqao1000ps60h6gdadcva"]}	2025-03-07 22:18:33.332	2025-03-07 22:18:33.332	[]
cmal50b5t0001s60h7kihnbfq	cm71zq1uu0000s60hsrg9iv1g	\N	Canvas view exploration. #shop	{shop}	{"😍": ["cm8ei2u30000is60hxldwf8tc"]}	2025-05-12 13:47:15.713	2025-05-12 13:47:15.713	[]
cm7z5dzk80001s60hauwe8nfn	cm7nx40e20005s60hqluumzai	\N	Do you ride normal or goofy? 🏂	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm8eqiaqa0004s60h5jnuu2om"]}	2025-03-07 19:07:33.32	2025-03-07 19:07:33.32	[]
cm7xvb8s10001s60hqqjdckj2	cm7wbitsi000cs60hq1jnj3px	\N	Shop Q1 Shopping Events creative 	{}	{"😍": ["cm6thw30g0008s60hkrj1wnge", "cm7lyry250000s60hl4e0yfts", "cm7uzjhwo0001s60ht1tuhtfi", "cm7nx40e20005s60hqluumzai", "cm7z9jt6f000as60ha21r1psy", "cm7z9lkyy000cs60h9jintrt8", "cm7yx5dc50000s60hlu2jxmg4", "cm8q2ot5j0005s60h4uc1j7ig"]}	2025-03-06 21:37:42.961	2025-03-06 21:37:42.961	[]
cmae2kmcr0001s60hi437hc2z	cm7tp7xd4000gs60h1hu9598i	\N	Easy product creation via Intents	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm8ei0oz5000hs60hf1b48fw9", "cm8ivgrng000gs60hkctfinsz", "cm71zq1uu0000s60hsrg9iv1g", "cm8eiqao1000ps60h6gdadcva"]}	2025-05-07 15:04:41.259	2025-05-07 15:04:41.259	[]
cm7z980mr0008s60hle3wo05d	cm7z93nvr0004s60hcxgjwyln	\N	Sign in with Shop w/ @ryancordell 	{}	{"😍": ["cm7z8n3im0003s60hurlp3xkp", "cm7z9jt6f000as60ha21r1psy", "cm7xvkve80003s60hi7nmelq4", "cm7z9l7jf000bs60hg2j29tcc"]}	2025-03-07 20:54:53.236	2025-03-07 20:54:53.236	[]
cmbtxb3wl0001s60h4se3xor0	cm7uu06ge0010s60hmocr9lu5	\N	Exploring some vision work for how we present stores on #shop	{shop}	{"😍": ["cm8egwen60008s60h4d235z20", "cmet4iaps0000s60hbyycrgmn"]}	2025-06-12 22:01:20.517	2025-06-12 22:01:20.517	[]
cm7z9mq4d000es60hoko4z84k	cm7nx40e20005s60hqluumzai	\N	Progressive DISCLOSURE — collapsing categories on search results	{}	{"😍": ["cm71zq1uu0000s60hsrg9iv1g"]}	2025-03-07 21:06:19.453	2025-03-07 21:06:19.453	[]
cmgl55qqj0001s60hdqq0ninn	cm8et181v001qs60hjqt3qupa	\N	Crop presets mobile web file editor 	{}	{"😍": ["cm8fyv6xs0007s60h8mmy9uqd", "cm8ejlo910019s60hgjz1akqg", "cm864b3pp0000s60huf1fmkg0", "cmf2s9la30004s60hxnfnqget"]}	2025-10-10 17:49:43.195	2025-10-10 17:49:43.195	[]
cm8erxww80008s60h9mk0wpos	cm71zq1uu0000s60hsrg9iv1g	\N	Exploring a deep research concept. #shop #origami	{shop,origami}	{"😍": ["cm6thw30g0008s60hkrj1wnge", "cm7v5oid90000s60hen2v9rg2"]}	2025-03-18 17:35:27.176	2025-03-18 17:35:27.176	[]
cm8elxfnk002ds60h8zl13njy	cm7uu06ge0010s60hmocr9lu5	\N	Oldie but goodie... Early exploration for visual search in #shop	{shop}	{"😍": ["cm8eo86ln0039s60hifbofb7z", "cm8ejbj6l000ys60h8f353fxd", "cm8hm62380000s60hdm8kycpv", "cm8lpbgyb0000s60h5bevenyb"], "🤔": ["cm8emt3u4002qs60hvpyias29"]}	2025-03-18 14:47:07.136	2025-03-18 14:47:07.136	[]
cm7z9oixg000hs60hrssu3mcm	cm7z9lkyy000cs60h9jintrt8	\N	Shopify Email - Spotlight GIF to showcase our new padding feature alongside a new template\n	{}	{"😍": ["cm7z9l7jf000bs60hg2j29tcc", "cm7z9lkyy000cs60h9jintrt8", "cm7zc3ylp0000s60hpc7gtlbl", "cm7xvkve80003s60hi7nmelq4", "cm84lb2sn0000s60hqn6v7ogq"]}	2025-03-07 21:07:43.444	2025-03-07 21:07:43.444	[]
cm8393uj3000as60h2e9ykmd3	cm838k8c90004s60hgmf319ly	\N	Bubble chart prototype	{}	{"😍": ["cm838bihr0003s60ho64izcoq", "cm83u3z1z0000s60hvbzqic4w", "cm7uu06ge0010s60hmocr9lu5", "cm84lb2sn0000s60hqn6v7ogq", "cm8ejcicz000zs60hjy10f6j3", "cm8eqiaqa0004s60h5jnuu2om"]}	2025-03-10 16:02:43.407	2025-03-10 16:02:43.407	[]
cm7zdos4i000as60hoqj2csxx	cm7yx5dc50000s60hlu2jxmg4	\N	Color Season	{}	{"😍": ["cm7z9l7jf000bs60hg2j29tcc", "cm7lyry250000s60hl4e0yfts", "cm7uu06ge0010s60hmocr9lu5", "cm6tofeoq0000s60htca0gvcm", "cm8ejcicz000zs60hjy10f6j3", "cm8hm62380000s60hdm8kycpv"]}	2025-03-07 22:59:53.826	2025-03-07 22:59:53.826	[]
cm8ox36390002s60hmxhd0fqe	cm7uu06ge0010s60hmocr9lu5	\N	Shop Minis - Exploring adding a bit of nostalgia and delight to the ShopCast mini concept. \n\n#shop #mini	{shop,mini}	{"😍": ["cm8oli66z0005s60hee9a2ejd", "cm8ejkc6h0015s60hpilouny1", "cm8ggdz9b0000s60hm651eb4x", "cm8rqazgb0009s60h0qf5rdbj", "cm8eqiaqa0004s60h5jnuu2om"], "🤔": ["cm8erozd20005s60h3n1u3taw"]}	2025-03-25 19:57:12.214	2025-03-25 19:57:12.214	[]
cm7w0568r0003s60hojgh9182	cm7thki660000s60hlrru9mhx	\N	Hardware renders from the 2025 retail ambitions sizzle reel. #render #retail	{render,retail}	{"😍": ["cm7thki660000s60hlrru9mhx", "cm71zq1uu0000s60hsrg9iv1g", "cm6zewlv30000s60hiwupvnso", "cm7za6450000js60h1p0i3k3s", "cm6tofeoq0000s60htca0gvcm"], "🤔": []}	2025-03-05 14:17:25.467	2025-03-05 14:17:25.467	[]
cm9hdsx3v0002s60hhoose4wo	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Exploring Outfit change transition for our next #mini \n\n#shop #avatar 	{mini,shop,avatar}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm8eqiaqa0004s60h5jnuu2om", "cm7uu06ge0010s60hmocr9lu5"]}	2025-04-14 18:02:40.411	2025-04-14 18:02:40.411	[]
cm7za6t1t000ls60hdoyfin2j	cm7za6450000js60h1p0i3k3s	\N	Thank you and Order status page upgrade guide - Mark items as reviewed	{}	{"😍": ["cm7xvkve80003s60hi7nmelq4", "cm7z93nvr0004s60hcxgjwyln", "cm8eq9nx10049s60h7i31r9eo"]}	2025-03-07 21:21:56.369	2025-03-07 21:21:56.369	[]
cm7zdg0fy0001s60hxbjfha48	cm7waaezb0005s60hjxfkpznf	\N	Translation feedback mechanism for merchants using AI translated admin languages. This is mapped to a translation framework and gets fed into a flywheel where we can adjust the prompt or fix specific strings.	{}	{"😍": ["cm7wayd3g000bs60htgdbt3mm", "cm7ny5spo0000s60hqabmc2ws", "cm84lb2sn0000s60hqn6v7ogq", "cm7w6ijj1000as60hsdoavuck", "cm7z9lkyy000cs60h9jintrt8"]}	2025-03-07 22:53:04.701	2025-03-07 22:53:04.701	[]
cm8383mo00001s60hh469qamg	cm7z9l7jf000bs60hg2j29tcc	\N	Exploring placing the same form in multiple channels in the Forms app.\n\n#admin #forms #editor	{admin,forms,editor}	{"😍": ["cm8ejcicz000zs60hjy10f6j3", "cm7z8n3im0003s60hurlp3xkp"], "🤔": ["cm7v5oid90000s60hen2v9rg2"]}	2025-03-10 15:34:33.6	2025-03-10 15:34:33.6	[]
cm7zdts4q000ds60hdjbaeuci	cm7yx5dc50000s60hlu2jxmg4	\N	Minis Icons	{}	{"😍": ["cm7lyry250000s60hl4e0yfts", "cm7uu06ge0010s60hmocr9lu5", "cm8ejcicz000zs60hjy10f6j3", "cm8hiiwlc0004s60h9o1yozwa"]}	2025-03-07 23:03:47.114	2025-03-07 23:03:47.114	[]
cmaeilscg0001s60heqxl0q2f	cm8f1rww4004cs60h6988nojl	\N	#checkout pay now button when blocking UI extensions are still loading.	{checkout}	{"😍": ["cm8elru8h0028s60huygpj285", "cm7z93nvr0004s60hcxgjwyln"]}	2025-05-07 22:33:29.536	2025-05-07 22:33:29.536	[]
cm7w6s471000ds60hhteycpba	cm7w6pvky000bs60hmb38qjbd	\N	Concept for new Theme Store first land	{}	{"😍": ["cm7thki660000s60hlrru9mhx", "cm7nm6s9j0000s60hxxf8hx4i", "cm7w6ijj1000as60hsdoavuck", "cm7w8g3650000s60h5rzvmqcw", "cm7waaezb0005s60hjxfkpznf", "cm6thw30g0008s60hkrj1wnge", "cm71zq1uu0000s60hsrg9iv1g", "cm7wibdne000ps60hzeyyelxl", "cm7ny5spo0000s60hqabmc2ws", "cm7wayd3g000bs60htgdbt3mm", "cm8eij1gl000os60hhtkl2186", "cm8ei0oz5000hs60hf1b48fw9"]}	2025-03-05 17:23:13.598	2025-03-05 17:23:13.598	[]
cm86b4oy00001s60h7n783nwj	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Daily Fit Calendar concept	{}	{"😍": ["cm7z9l7jf000bs60hg2j29tcc", "cm7lyry250000s60hl4e0yfts", "cm6tofeoq0000s60htca0gvcm", "cm8ejcicz000zs60hjy10f6j3", "cm8ejbj6l000ys60h8f353fxd", "cm8en5els002xs60h8xxuak16", "cm8eo86ln0039s60hifbofb7z", "cm8epqcuw003xs60hs4dloj14", "cm8ei9oo7000ms60hkcdl4q7z", "cm8eqiaqa0004s60h5jnuu2om", "cm8esfinv0010s60hye1l9kjh", "cm8eo58zt0036s60ht4c3mf3x", "cm7whzxin000fs60hky65yi4a", "cm8ehms5q000fs60huvpbq36w"], "🤔": ["cm6thw30g0008s60hkrj1wnge"]}	2025-03-12 19:22:40.584	2025-03-12 19:22:40.584	[]
cm7xw0l2h0005s60hr2gi3wxw	cm7tp7xd4000gs60h1hu9598i	\N	Had a random idea to build a full prompt interface into the PDP today... Not sure it totally works but kinda fun to put together...	{}	{"😍": ["cm7z9jt6f000as60ha21r1psy", "cm7z9l7jf000bs60hg2j29tcc", "cm83u3z1z0000s60hvbzqic4w", "cm8ejmu4v001as60h8yyrvcc9", "cm8en5db7002ws60hbj8h20c5", "cm8f7bgm30000s60hppdd0h38"]}	2025-03-06 21:57:25.29	2025-03-06 21:57:25.29	[]
cm7wjiknm000ts60hodvu94qr	cm7wayd3g000bs60htgdbt3mm	\N	Exploration for an in-context prompt for App Store reviews	{}	{"😍": ["cm7ny5spo0000s60hqabmc2ws", "cm7w6ijj1000as60hsdoavuck", "cm7uzjhwo0001s60ht1tuhtfi", "cm7w6pvky000bs60hmb38qjbd", "cm7waaezb0005s60hjxfkpznf", "cm8ehms5q000fs60huvpbq36w", "cm8iv1f4o0006s60hbu5l5lhs"]}	2025-03-05 23:19:43.378	2025-03-05 23:19:43.378	[]
cm838xuhs0007s60hv0f03s5x	cm838k8c90004s60hgmf319ly	\N	Selecting bar count and group other on charts.	{}	{"😍": ["cm838bihr0003s60ho64izcoq", "cm83u3z1z0000s60hvbzqic4w", "cm7uu06ge0010s60hmocr9lu5", "cm84lb2sn0000s60hqn6v7ogq", "cm7z9l7jf000bs60hg2j29tcc", "cm8ejcicz000zs60hjy10f6j3"]}	2025-03-10 15:58:03.424	2025-03-10 15:58:03.424	[]
cm9k1cewy0001s60hluvmtein	cm7tp7xd4000gs60h1hu9598i	\N	Extensibility on the PDP #merchandising	{merchandising}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm9r63ydr0000s60hlp5k3pxk", "cm8ivgrng000gs60hkctfinsz", "cm8el1bj50020s60hty74lkf9", "cm6zewlv30000s60hiwupvnso", "cm9u7dhwd0000s60hin5hui0w"], "🤔": ["cm8ei2u30000is60hxldwf8tc", "cm8eqiaqa0004s60h5jnuu2om"]}	2025-04-16 14:37:13.474	2025-04-16 14:37:13.474	[]
cm8qlbtg00002s60hhxmklc1e	cm8ei0oz5000hs60hf1b48fw9	\N	flip thru theme options (scroll) #growth	{growth}	{"😍": ["cm8qmowb50001s60hdfqv2f4x", "cm8esf3rq000ys60hv7l3k2vy", "cm8rbzgo60004s60hgd4gn4tz", "cm6zjpx940000s60h8whb0img", "cm8erl7u80003s60hebi0qrx1", "cm8ej4knm000rs60hcjl32a85", "cm7jke4p00003s60hauy0agm1", "cm8nddqq20004s60hrpowzwtd", "cm8ejlo910019s60hgjz1akqg", "cm8etdrpr0022s60ho61sbpqb"]}	2025-03-27 00:03:32.689	2025-03-27 00:03:32.689	[]
cmav8qexb0002s60heel4qzss	cm9a4uiz50000s60h9etzsbuf	\N	Quick educational guide	{}	{}	2025-05-19 15:29:14.256	2025-05-19 15:29:14.256	[]
cm8ni226s000es60hqug5mcu3	cm8ejkqci0017s60h1da0ulse	\N	From a series of ads directing folks to the homepage. Built in 1x1, 16x9, 9x16\n#corecreative #homepage	{corecreative,homepage}	{"😍": ["cm8njlq6k0000s60hujvx2kbg", "cm8nk5rtq0002s60harmh7mlq", "cm8j3b3je001vs60h1s728b28", "cm8ok0f7k0001s60hd2cmwhmj", "cm8eo58zt0036s60ht4c3mf3x", "cm8ejlo910019s60hgjz1akqg", "cm8ej4knm000rs60hcjl32a85", "cm8el1bj50020s60hty74lkf9", "cm8eqiaqa0004s60h5jnuu2om", "cm8empxpm002ps60hwnc2iw1z"]}	2025-03-24 20:08:40.084	2025-03-24 20:08:40.084	[]
cm9bsn7250001s60h7e9yxh25	cm97eexj40000s60h9oerv3n8	\N	Fun type animation for Shop Mini Dreamboard contest.	{}	{"😍": ["cm7yx5dc50000s60hlu2jxmg4", "cm8ndcbs80003s60hxb80e6tc", "cm7uu06ge0010s60hmocr9lu5", "cm8xar7n70000s60htncbv94a", "cm8ejkncb0016s60hegr5c8xa", "cm8ekjy21001os60hsk8ue62t", "cm8eqiaqa0004s60h5jnuu2om", "cm9vk4eil0000s60hp3gnceoo", "cm8ej63t6000ss60h99hkq1b2"]}	2025-04-10 20:11:30.557	2025-04-10 20:11:30.557	[]
cm8taj0fv000xs60hx8bsp9pk	cm8iuzb3n0005s60hnmme2v1y	\N	Content and UX for "Continue with Card" screen #growth #monetization	{growth,monetization}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm8iuzb3n0005s60hnmme2v1y", "cm8esf3rq000ys60hv7l3k2vy", "cm6zjpx940000s60h8whb0img", "cm8egfitt0001s60hr9zydwp1", "cm8rqtndo000ds60hxkkhwe6x", "cm8nddqq20004s60hrpowzwtd", "cm8ejlo910019s60hgjz1akqg"]}	2025-03-28 21:24:31.1	2025-03-28 21:24:31.1	[]
cm8oqp97o0013s60hr4mujt67	cm8oli66z0005s60hee9a2ejd	\N	Weight and dimensions card for the new delivery detail view. #tracking	{tracking}	{"😍": ["cm8ejlo910019s60hgjz1akqg", "cm7uu06ge0010s60hmocr9lu5", "cm71zq1uu0000s60hsrg9iv1g", "cm8oli66z0005s60hee9a2ejd", "cm84lb2sn0000s60hqn6v7ogq", "cm8eqiaqa0004s60h5jnuu2om", "cm8erl7u80003s60hebi0qrx1", "cm97eexj40000s60h9oerv3n8", "cm7nx40e20005s60hqluumzai"], "🤔": []}	2025-03-25 16:58:25.381	2025-03-25 16:58:25.381	[]
cmbtz60fv0001s60hi5uasbk3	cm7uu06ge0010s60hmocr9lu5	\N	a few other menu explorations worth a share... #shop	{shop}	{"😍": ["cm7z8n3im0003s60hurlp3xkp"]}	2025-06-12 22:53:21.972	2025-06-12 22:53:21.972	[]
cm90cfd770004s60hmxs2mu5p	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Exploration for how we select and crop items for Image Search #mini\n\n#shop	{mini,shop}	{"😍": ["cm8ekjy21001os60hsk8ue62t", "cm90a6ep50000s60hinipyvfi", "cm7z93nvr0004s60hcxgjwyln", "cm8ndcbs80003s60hxb80e6tc"]}	2025-04-02 19:52:03.476	2025-04-02 19:52:03.476	[]
cmek61lgx0004s60hh1x7uetv	cm8ysolaf0000s60h165ztlk4	\N	Plus differentiation — OC, desktop	{}	{}	2025-08-20 16:07:18.513	2025-08-20 16:07:18.513	[]
cm9inbrso0001s60hqj0ggxt8	cm71zq1uu0000s60hsrg9iv1g	\N	Little out there visual search concept. #shop	{shop}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm8ei2u30000is60hxldwf8tc", "cm9r63ydr0000s60hlp5k3pxk", "cm8ei0oz5000hs60hf1b48fw9", "cm8nfbsvx000as60h6ixu0t3n", "cm8ejbj6l000ys60h8f353fxd"]}	2025-04-15 15:17:02.712	2025-04-15 15:17:02.712	[]
cmfbas86y0001s60h7minjxjo	cm8hfo85u0002s60hrw71e8v4	\N	Concept for a Shopify Demo store	{}	{"😍": ["cm8ixpljw001es60hqdbihh7p", "cm8ei0oz5000hs60hf1b48fw9"]}	2025-09-08 15:49:46.234	2025-09-08 15:49:46.234	[]
cmeu8d4vn0001s60h4ff1cbxu	cm8et181v001qs60hjqt3qupa	\N	Mobile Online store editor revamp concept 	{}	{"😍": ["cm8et181v001qs60hjqt3qupa", "cm7z93nvr0004s60hcxgjwyln", "cm8ev050c003fs60hl2cyyugr"]}	2025-08-27 17:09:57.875	2025-08-27 17:09:57.875	[]
cm8z08tx10001s60hmk82o3if	cm8okkpn20004s60hi9twmhhm	\N	Bento Box animation from the BFCM Toolkit Sizzle #BFCM #core	{BFCM,core}	{"😍": ["cm8etdrpr0022s60ho61sbpqb", "cm8ejkqci0017s60h1da0ulse", "cm8eif74r000ns60h7q24vin3", "cm8eqiaqa0004s60h5jnuu2om", "cm7thki660000s60hlrru9mhx", "cm8ei0oz5000hs60hf1b48fw9", "cm8ekjy21001os60hsk8ue62t", "cm8hvl42z0004s60h4v1352m9", "cm8emd06d002ks60h2409ys0r", "cm8empxpm002ps60hwnc2iw1z"]}	2025-04-01 21:23:16.981	2025-04-01 21:23:16.981	[]
cm8z2lj8a0005s60h19fya53c	cm6tpgqwl0000s60hwj4xjow3	\N	Mode switch concept from individual Shop account to Creator account. #shop 	{shop}	{"😍": ["cm8erl7u80003s60hebi0qrx1"]}	2025-04-01 22:29:08.89	2025-04-01 22:29:08.89	[]
cm8jd25jx002es60hgssmv2el	cm8etdrpr0022s60ho61sbpqb	\N	Earlier version of Sidekick with voice mode toggle – co-designed with @arda\n\n#growth #sidekick	{growth,sidekick}	{"😍": ["cm8egfitt0001s60hr9zydwp1", "cm7uu06ge0010s60hmocr9lu5", "cm8ei0oz5000hs60hf1b48fw9", "cm71zq1uu0000s60hsrg9iv1g", "cm7oyhrpy0000s60hp7oifrws", "cm8em6fwr002fs60h69moo9ct", "cm8en3qp3002ts60h6jmgqivy", "cm6zjpx940000s60h8whb0img", "cm8elwpq9002bs60hedm3l2yj", "cm8eo58zt0036s60ht4c3mf3x", "cm8esf3rq000ys60hv7l3k2vy", "cm8qmowb50001s60hdfqv2f4x", "cm6tiei9k000es60hq4f5uty7", "cm8rq00my0007s60ht7qsax7w", "cm8ggdz9b0000s60hm651eb4x", "cm8iuzb3n0005s60hnmme2v1y", "cm8ej8d93000ts60h1e14plz5", "cm8esi6pm0016s60hjjebqdrq"], "🤔": ["cm6thw30g0008s60hkrj1wnge"]}	2025-03-21 22:37:41.661	2025-03-21 22:37:41.661	[]
cmav4b2vo0001s60hi307mlri	cm7tp7xd4000gs60h1hu9598i	\N	Creating a product via prompt	{}	{"😍": ["cm9r7l1f10000s60hq8gvmecx"]}	2025-05-19 13:25:20.34	2025-05-19 13:25:20.34	[]
cm8oqlwmx0010s60hu648lt2s	cm8esf3rq000ys60hv7l3k2vy	\N	Onboarding tasks on home for retail merchants #growth	{growth}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm8ejlo910019s60hgjz1akqg", "cm6zjpx940000s60h8whb0img", "cm8oli66z0005s60hee9a2ejd", "cm8esi6pm0016s60hjjebqdrq"]}	2025-03-25 16:55:49.113	2025-03-25 16:55:49.113	[]
cm8ep9p9g003os60hz2ssc0h5	cm8eo58zt0036s60ht4c3mf3x	\N	#ShopifySupply idle state 	{ShopifySupply}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm8eo58zt0036s60ht4c3mf3x", "cm8eozabi003hs60hwv83es2p", "cm8eqiaqa0004s60h5jnuu2om", "cm7z9l7jf000bs60hg2j29tcc", "cm8eppynb003ws60h81mtnp4e", "cm8eu7rma002ss60hly65jbvi", "cm8ei0oz5000hs60hf1b48fw9", "cm8ok0f7k0001s60hd2cmwhmj"]}	2025-03-18 16:20:38.309	2025-03-18 16:20:38.309	[]
cm8equo2f000ds60hq7ckbk2e	cm8eqiaqa0004s60h5jnuu2om	\N	Youtube ad created in collaboration with Kate Icely, Jose Silva, and Connell McCarthy for our UI Extensions campaign. \n#retail 	{retail}	{"😍": ["cm7thki660000s60hlrru9mhx", "cm6zjpx940000s60h8whb0img", "cm6thw30g0008s60hkrj1wnge", "cm8ejkt910018s60httxfcf76", "cm8gacbrl0002s60hdepy7bws", "cm8hi0xco0001s60h0omgywsh", "cm8eqh9wo0002s60htqsgawqh", "cm8er27yw0000s60h8ewpyq20", "cm8stybly0002s60hftnein0g"]}	2025-03-18 17:04:56.151	2025-03-18 17:04:56.151	[]
cm8q3w3ws0008s60hug05sk0p	cm87e0fpo0000s60ha7hoh1rr	\N	first go at profiles in Shop	{}	{"😍": ["cm6thw30g0008s60hkrj1wnge", "cm7uu06ge0010s60hmocr9lu5", "cm7v5oid90000s60hen2v9rg2", "cm8ej8d93000ts60h1e14plz5", "cm8nddqq20004s60hrpowzwtd", "cm8eiqao1000ps60h6gdadcva"]}	2025-03-26 15:55:26.284	2025-03-26 15:55:26.284	[]
cm8rsc2fi000js60hbt1v6kde	cm8elwpq9002bs60hedm3l2yj	\N	Exploring some subtle, communicative motion for an upcoming experiment with AI screen share in Help Center! #growth	{growth}	{"😍": ["cm8ggdz9b0000s60hm651eb4x", "cm8etdrpr0022s60ho61sbpqb", "cm8ei0oz5000hs60hf1b48fw9", "cm6zjpx940000s60h8whb0img", "cm8ejlo910019s60hgjz1akqg", "cm8n6hq410007s60h9j7ivkby", "cm8nddqq20004s60hrpowzwtd", "cm84lb2sn0000s60hqn6v7ogq"]}	2025-03-27 20:07:27.822	2025-03-27 20:07:27.822	[]
cm8ej8ol7000vs60huveq21a1	cm8ei2u30000is60hxldwf8tc	\N	Scan document to pre-fill forms #admin #payments	{admin,payments}	{"😍": ["cm8ejcicz000zs60hjy10f6j3", "cm8elij4a0024s60h7w4t0tzf", "cm7uu06ge0010s60hmocr9lu5", "cm8eqfigl0000s60h6t0ptv7l", "cm8erl7u80003s60hebi0qrx1", "cm6zjpx940000s60h8whb0img", "cm7oyhrpy0000s60hp7oifrws", "cm7tp7xd4000gs60h1hu9598i", "cm8eu7rma002ss60hly65jbvi", "cm8ei2u30000is60hxldwf8tc", "cm8x4cse20001s60hejj0mtgq"]}	2025-03-18 13:31:53.083	2025-03-18 13:31:53.083	[]
cm8ona6hw000os60hm4lqulmv	cm8ggdz9b0000s60hm651eb4x	\N	Smart Pricing — experiment running animation\n\n#growth	{growth}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm8em6fwr002fs60h69moo9ct", "cm8ejlo910019s60hgjz1akqg", "cm8esf3rq000ys60hv7l3k2vy", "cm6zjpx940000s60h8whb0img", "cm84lb2sn0000s60hqn6v7ogq", "cm8iuzb3n0005s60hnmme2v1y", "cm864b3pp0000s60huf1fmkg0", "cm8ei2u30000is60hxldwf8tc", "cm8elownj0027s60hawsv3dwc"], "🤔": ["cm8ok0f7k0001s60hd2cmwhmj"]}	2025-03-25 15:22:43.172	2025-03-25 15:22:43.172	[]
cm91fun300001s60hnkljj71s	cm8okkpn20004s60hi9twmhhm	\N	More snippets from the new BFCM '25 Toolkit #BFCM #core	{BFCM,core}	{"😍": ["cm8ekjy21001os60hsk8ue62t", "cm8elt5yz0029s60hc2wwhebn", "cm7v5oid90000s60hen2v9rg2", "cm8j3b3je001vs60h1s728b28", "cm8el1bj50020s60hty74lkf9", "cm8empxpm002ps60hwnc2iw1z"]}	2025-04-03 14:15:41.148	2025-04-03 14:15:41.148	[]
cm91sq71q0007s60h3b2mrfu8	cm8eo1etv0030s60hwtdzr22r	\N	/pos Overview page POC.	{}	{"😍": ["cm8eqiaqa0004s60h5jnuu2om", "cm8hi0xco0001s60h0omgywsh", "cm8ek16ru001hs60hbior11iu", "cm8el1bj50020s60hty74lkf9", "cm8z5x2kb0001s60hw0k73kfa", "cm6zjpx940000s60h8whb0img", "cm8ejsw8r001bs60hkkvtnfaw", "cm8gb1wkz0004s60hqv6vpj7q"]}	2025-04-03 20:16:08.75	2025-04-03 20:16:08.75	[]
cm8t4dlqa000js60hdjh9rsn1	cm8n6hq410007s60h9j7ivkby	\N	Summit badge - holographic edition	{}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm8esf3rq000ys60hv7l3k2vy", "cm8n6hq410007s60h9j7ivkby", "cm8nddqq20004s60hrpowzwtd", "cm8ei2u30000is60hxldwf8tc", "cm8exr4mq003qs60hcxg1wm7v", "cm8okkpn20004s60hi9twmhhm"], "🤔": ["cm6tofeoq0000s60htca0gvcm"]}	2025-03-28 18:32:21.059	2025-03-28 18:32:21.059	[]
cmcc3m9a80001s60hxqksyn2v	cm7tp7xd4000gs60h1hu9598i	\N	Been playing around with the idea of allowing multi-select on the Variant Details page - which would allow us to kill all of the crazy custom bulk edit flows we have for products.	{}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm8ga0f7c0001s60hyzrr3mpz", "cm8xb4iro0001s60hbzyuqq5y", "cm8ellt0w0026s60hg85woimb"]}	2025-06-25 15:17:49.568	2025-06-25 15:17:49.568	[]
cmbs167gc0001s60hb9x6avey	cm8elt5yz0029s60hc2wwhebn	\N	Shopify Keyboard Hero - Social	{}	{"😍": ["cm8hvl42z0004s60h4v1352m9", "cm8ekcp8f001ms60hv6zkh8lq", "cm84lb2sn0000s60hqn6v7ogq", "cm8egwen60008s60h4d235z20", "cm8ejkqci0017s60h1da0ulse", "cmebuwlpn000qs60hhed41i28", "cmfzmicjn0000s60hdv23xkap"]}	2025-06-11 14:13:57.947	2025-06-11 14:13:57.947	[]
cmfcxg7mn0001s60hlalsrbsa	cm7uzjhwo0001s60ht1tuhtfi	\N	daily sales widget \n	{}	{"😍": ["cm8ixpljw001es60hqdbihh7p", "cm8ei0oz5000hs60hf1b48fw9"]}	2025-09-09 19:12:02.975	2025-09-09 19:12:02.975	[]
cm8et8r77001zs60hh3ssz5fm	cm8erozd20005s60h3n1u3taw	\N	POS X • Lock Screen	{}	{"😍": ["cm8etdrpr0022s60ho61sbpqb", "cm7uu06ge0010s60hmocr9lu5", "cm8eu7rma002ss60hly65jbvi", "cm8ejkt910018s60httxfcf76", "cm7w8lz2d0001s60h7m7vk072", "cm8hiiwlc0004s60h9o1yozwa", "cm8nddqq20004s60hrpowzwtd", "cm6tofeoq0000s60htca0gvcm", "cm8oy4oen0008s60hfw4zmxwy"], "🤔": ["cm7nx40e20005s60hqluumzai"]}	2025-03-18 18:11:52.627	2025-03-18 18:11:52.627	[]
cm8z6dw930003s60h7lv4x57z	cm7yx5dc50000s60hlu2jxmg4	\N	Daily Fits	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm6thw30g0008s60hkrj1wnge", "cm8elt5yz0029s60hc2wwhebn", "cm8ej63t6000ss60h99hkq1b2"]}	2025-04-02 00:15:10.984	2025-04-02 00:15:10.984	[]
cm8nsm68p0001s60hd6cq17dr	cm8ei0oz5000hs60hf1b48fw9	\N	Exploration to scroll thru designs like album covers. #growth	{growth}	{"😍": ["cm6thmum10000s60hsx8v27ie", "cm8eq9rrd004as60h7in8f922", "cm8oj7wf20000s60hx3gsm03n", "cm8etdrpr0022s60ho61sbpqb", "cm6zjpx940000s60h8whb0img", "cm8elwpq9002bs60hedm3l2yj", "cm8em6fwr002fs60h69moo9ct", "cm8esf3rq000ys60hv7l3k2vy", "cm7uu06ge0010s60hmocr9lu5", "cm8erl7u80003s60hebi0qrx1", "cm8ejlo910019s60hgjz1akqg", "cm8ej4knm000rs60hcjl32a85"], "🤔": ["cm6thmum10000s60hsx8v27ie", "cm8eqiaqa0004s60h5jnuu2om"]}	2025-03-25 01:04:14.617	2025-03-25 01:04:14.617	[]
cm8es106n000cs60h6mffmpm4	cm7nx40e20005s60hqluumzai	\N	In-app polling and shoppable video	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm8ejbj6l000ys60h8f353fxd"], "🤔": ["cm7uu06ge0010s60hmocr9lu5", "cm7nx40e20005s60hqluumzai"]}	2025-03-18 17:37:51.407	2025-03-18 17:37:51.407	[]
cm8es3p6n000ls60hkl9ywy5l	cm71zq1uu0000s60hsrg9iv1g	\N	Tracking/orders vision work. #shop #origami	{shop,origami}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm8et181v001qs60hjqt3qupa", "cm8ivy2q7000is60hfk1iqbai", "cm8iwo4kb001cs60h29fyt6k7"], "🤔": ["cm7uu06ge0010s60hmocr9lu5", "cm7nx40e20005s60hqluumzai"]}	2025-03-18 17:39:57.12	2025-03-18 17:39:57.12	[]
cm8euasid0034s60hy4ae3o89	cm8erozd20005s60h3n1u3taw	\N	POS X • Ship to customer #retail	{retail}	{"😍": ["cm6zewlv30000s60hiwupvnso", "cm8eqiaqa0004s60h5jnuu2om", "cm8en5db7002ws60hbj8h20c5", "cm8oy4oen0008s60hfw4zmxwy"], "🤔": ["cm7nx40e20005s60hqluumzai"]}	2025-03-18 18:41:27.253	2025-03-18 18:41:27.253	[]
cm8eu9np7002ys60h6sjdv66h	cm8erozd20005s60h3n1u3taw	\N	POS X • Discounts #retail	{retail}	{"😍": ["cm8eqiaqa0004s60h5jnuu2om", "cm8ejkt910018s60httxfcf76", "cm8oy4oen0008s60hfw4zmxwy"], "🤔": ["cm7nx40e20005s60hqluumzai"]}	2025-03-18 18:40:34.364	2025-03-18 18:40:34.364	[]
cm8gdj2hi000as60hc2wbiaun	cm7tp7xd4000gs60h1hu9598i	\N	Concept for refreshing/simplifying the PDP	{}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm7uu06ge0010s60hmocr9lu5", "cm8ga0f7c0001s60hyzrr3mpz"], "🤔": ["cm7uu06ge0010s60hmocr9lu5", "cm7nx40e20005s60hqluumzai"]}	2025-03-19 20:27:32.311	2025-03-19 20:27:32.311	[]
cm8eubaqp0037s60hl1izkurk	cm8erozd20005s60h3n1u3taw	\N	POS X • Sub nav #retail	{retail}	{"😍": ["cm6zewlv30000s60hiwupvnso", "cm8eqiaqa0004s60h5jnuu2om", "cm8ei2u30000is60hxldwf8tc", "cm8oy4oen0008s60hfw4zmxwy"], "🤔": ["cm7nx40e20005s60hqluumzai"]}	2025-03-18 18:41:50.881	2025-03-18 18:41:50.881	[]
cm8euaalp0031s60hjic1wzll	cm8erozd20005s60h3n1u3taw	\N	POS X • Main nav #retail	{retail}	{"😍": ["cm6zewlv30000s60hiwupvnso", "cm8eqiaqa0004s60h5jnuu2om", "cm8ejkt910018s60httxfcf76", "cm8hv4w290000s60huatd0mjt", "cm8oy4oen0008s60hfw4zmxwy"], "🤔": ["cm7nx40e20005s60hqluumzai"]}	2025-03-18 18:41:04.045	2025-03-18 18:41:04.045	[]
cm8eu90sm002us60h9hjogy8e	cm8erozd20005s60h3n1u3taw	\N	POS X • Add to cart #retail	{retail}	{"😍": ["cm8eqiaqa0004s60h5jnuu2om", "cm8ejkt910018s60httxfcf76", "cm8ei2u30000is60hxldwf8tc", "cm8onbupz000qs60hq5d3mdiz", "cm8oy4oen0008s60hfw4zmxwy", "cm8rbzgo60004s60hgd4gn4tz"], "🤔": ["cm7nx40e20005s60hqluumzai"]}	2025-03-18 18:40:04.679	2025-03-18 18:40:04.679	[]
cm8psqnb20002s60hiis3v3p3	cm8pse5mn0000s60hyjrczgi5	\N	New Discounting UX on POS	{}	{"😍": ["cm8odcab10000s60h6h545z8s", "cm8o9znkh0000s60hd5emhds8"], "🤔": ["cm8erozd20005s60h3n1u3taw"]}	2025-03-26 10:43:15.71	2025-03-26 10:43:15.71	[]
cm8es3iev000is60he13o1tko	cm7nx40e20005s60hqluumzai	\N	Tagged products picture-in-picture	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm8eqiaqa0004s60h5jnuu2om", "cm8ejbj6l000ys60h8f353fxd", "cm8nk5rtq0002s60harmh7mlq", "cm6tpgqwl0000s60hwj4xjow3"], "🤔": ["cm7uu06ge0010s60hmocr9lu5", "cm7nx40e20005s60hqluumzai"]}	2025-03-18 17:39:48.344	2025-03-18 17:39:48.344	[]
cm8f0xzec0044s60hrqiidfh7	cm8exr4mq003qs60hcxg1wm7v	\N	#collabs Creator Shop Grand Opening	{collabs}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm8ejbj6l000ys60h8f353fxd", "cm8et973x0021s60hr0vv4y5r", "cm8ei2u30000is60hxldwf8tc", "cm7nx40e20005s60hqluumzai", "cm8j0qlds001rs60hy6k9txuj"], "🤔": ["cm7nx40e20005s60hqluumzai"]}	2025-03-18 21:47:26.964	2025-03-18 21:47:26.964	[]
cm89gtnna0001s60hl76g5y62	cm7w8mea50002s60h0gesz0yx	\N	Cart building interactions on POS #retail	{retail}	{"😍": ["cm7v5oid90000s60hen2v9rg2", "cm7w8lz2d0001s60h7m7vk072", "cm6tofeoq0000s60htca0gvcm", "cm8ejcicz000zs60hjy10f6j3", "cm8ejkt910018s60httxfcf76", "cm8em6fwr002fs60h69moo9ct", "cm8en3qp3002ts60h6jmgqivy", "cm8eqh9wo0002s60htqsgawqh", "cm6zjpx940000s60h8whb0img", "cm8hv4w290000s60huatd0mjt", "cm71zq1uu0000s60hsrg9iv1g"], "🤔": []}	2025-03-15 00:25:21.91	2025-03-15 00:25:21.91	[]
cm8es254f000fs60h0hweva52	cm7nx40e20005s60hqluumzai	\N	Add to cart transition	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm8eo58zt0036s60ht4c3mf3x", "cm8eqiaqa0004s60h5jnuu2om"], "🤔": ["cm7uu06ge0010s60hmocr9lu5"]}	2025-03-18 17:38:44.463	2025-03-18 17:38:44.463	[]
cm8es55kl000us60h3lr62k6s	cm7nx40e20005s60hqluumzai	\N	Shop Web loading splash	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm8eppynb003ws60h81mtnp4e", "cm8eqiaqa0004s60h5jnuu2om", "cm8fxon760002s60hqveasvmv"], "🤔": ["cm7uu06ge0010s60hmocr9lu5"]}	2025-03-18 17:41:05.013	2025-03-18 17:41:05.013	[]
cm97ft13e0004s60hn9qxqbuw	cm7nx40e20005s60hqluumzai	\N	Branded search for intersectional Shopify merchant and product	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm6tofeoq0000s60htca0gvcm", "cm7nx40e20005s60hqluumzai", "cm8eqh9wo0002s60htqsgawqh", "cm8elwpq9002bs60hedm3l2yj"]}	2025-04-07 19:01:03.05	2025-04-07 19:01:03.05	[]
cm8z6grrv0006s60hzzkwaf5n	cm7yx5dc50000s60hlu2jxmg4	\N	daily fits 	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm8eppynb003ws60h81mtnp4e", "cm6thw30g0008s60hkrj1wnge", "cm8okkpn20004s60hi9twmhhm", "cm8erl7u80003s60hebi0qrx1"]}	2025-04-02 00:17:25.148	2025-04-02 00:17:25.148	[]
cm8inc3z8000as60hddp7f7e3	cm8ei2u30000is60hxldwf8tc	\N	Finances sublayer exploration #admin 	{admin}	{"😍": ["cm8ei2u30000is60hxldwf8tc", "cm8onbupz000qs60hq5d3mdiz", "cm8g7n07x000xs60hext20mbs"], "🤔": ["cm7nx40e20005s60hqluumzai"]}	2025-03-21 10:37:36.164	2025-03-21 10:37:36.164	[]
cm8in03ty0004s60hz8yhyi2i	cm8ei2u30000is60hxldwf8tc	\N	Native app welcome screen exploration with Rive + Figma #admin 	{admin}	{"😍": ["cm8ei2u30000is60hxldwf8tc", "cm7uyxpiz0013s60hceras7ah", "cm8hiiwlc0004s60h9o1yozwa", "cm7jke4p00003s60hauy0agm1"], "🤔": ["cm7nx40e20005s60hqluumzai", "cm8ev050c003fs60hl2cyyugr", "cm6thw30g0008s60hkrj1wnge"]}	2025-03-21 10:28:16.103	2025-03-21 10:28:16.103	[]
cm8iw2478000qs60hk4h023oz	cm8ei0oz5000hs60hf1b48fw9	\N	Little interaction details for a new home experience. #growth	{growth}	{"😍": ["cm6zjpx940000s60h8whb0img", "cm8ejlo910019s60hgjz1akqg", "cm8erl7u80003s60hebi0qrx1", "cm8g0tssb000ks60hgqq0uze0", "cm8esf3rq000ys60hv7l3k2vy", "cm8elwpq9002bs60hedm3l2yj"], "🤔": ["cm7nx40e20005s60hqluumzai"]}	2025-03-21 14:41:46.436	2025-03-21 14:41:46.436	[]
cm8i3jjjf0001s60h97wex0cm	cm8ei2u30000is60hxldwf8tc	\N	Managed Markets banner → zero state → activated #admin #cross-border 	{admin,cross}	{"😍": ["cm8ei2u30000is60hxldwf8tc", "cm8ei0oz5000hs60hf1b48fw9", "cm8iwo4kb001cs60h29fyt6k7", "cm7oyhrpy0000s60hp7oifrws", "cm9u7dhwd0000s60hin5hui0w"]}	2025-03-21 01:23:30.603	2025-03-21 01:23:30.603	[]
cm8j9z0ke0021s60he1v3wbhp	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Daily Fits\n\nYa'll mind if I bring Path back? 😅	{}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm8nddqq20004s60hrpowzwtd", "cm7lyry250000s60hl4e0yfts", "cm8esf3rq000ys60hv7l3k2vy"]}	2025-03-21 21:11:16.382	2025-03-21 21:11:16.382	[]
cm8izlqus001ns60hrecbqqf0	cm8erl7u80003s60hebi0qrx1	\N	Native setup guidance concept (iOS)	{}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm6zjpx940000s60h8whb0img", "cm7jke4p00003s60hauy0agm1", "cm8nddqq20004s60hrpowzwtd", "cm8elwpq9002bs60hedm3l2yj", "cm8esf3rq000ys60hv7l3k2vy"], "🤔": ["cm7nx40e20005s60hqluumzai", "cm6thw30g0008s60hkrj1wnge"]}	2025-03-21 16:21:01.109	2025-03-21 16:21:01.109	[]
cm8imrsl70001s60h0lmgstzk	cm8ei2u30000is60hxldwf8tc	\N	Shop scene generator from Hack Days 35 #shop	{shop}	{"😍": ["cm8ei2u30000is60hxldwf8tc", "cm7uu06ge0010s60hmocr9lu5"], "🤔": ["cm7nx40e20005s60hqluumzai"]}	2025-03-21 10:21:48.283	2025-03-21 10:21:48.283	[]
cm8rirhir001qs60hgj93rie4	cm8esf3rq000ys60hv7l3k2vy	\N	Exploration for integrating hardware selection into plan checkout #growth	{growth}	{}	2025-03-27 15:39:31.06	2025-03-27 15:39:31.06	[]
cm8nbj3360006s60hwnwhaepy	cm8emmes1002os60hfgdnrd49	\N	Micro-interaction exploration for Polaris icons	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm8ejmu4v001as60h8yyrvcc9", "cm8em6fwr002fs60h69moo9ct", "cm8hwdx8w0000s60hxeim74xo", "cm8ej8d93000ts60h1e14plz5"], "🤔": ["cm7v5oid90000s60hen2v9rg2"]}	2025-03-24 17:05:57.09	2025-03-24 17:05:57.09	[]
cm8iwkkdl001as60hi0ziy5zi	cm8hiiwlc0004s60h9o1yozwa	\N	Aspirational marketing for Shopify app dev tools -  Real-time feedback loop enhances productivity by enabling quick iterations and adjustments, ensuring that your application looks and functions as intended.	{}	{"😍": ["cm6zjpx940000s60h8whb0img", "cm8egfitt0001s60hr9zydwp1", "cm6tpgqwl0000s60hwj4xjow3"]}	2025-03-21 14:56:07.21	2025-03-21 14:56:07.21	[]
cm8j9s9xr001ys60h6eq5osfa	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Shopcast\n\nIdea is we would create an ai podcast episode off your collections created in the Shop App. I could see this evolving into adding a local news style briefing of the status of your packages... 	{}	{"😍": ["cm8ndvc1e0009s60hd2s0mvn7", "cm8j3b3je001vs60h1s728b28", "cm8eo58zt0036s60ht4c3mf3x", "cm6zo4gzv0000s60hv96hpnc8"]}	2025-03-21 21:06:01.935	2025-03-21 21:06:01.935	[]
cm9vegwv60001s60hd3o4mbmz	cm8ei2u30000is60hxldwf8tc	\N	Document scan with AI-generated loading image + animation #admin #payments	{admin,payments}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm9u7dhwd0000s60hin5hui0w"]}	2025-04-24 13:30:06.306	2025-04-24 13:30:06.306	[]
cm8in4mh10007s60hvf0ajalm	cm8ei2u30000is60hxldwf8tc	\N	Review checkout setup in Shopify onboarding #admin 	{admin}	{"😍": ["cm8ei2u30000is60hxldwf8tc", "cm8ejlo910019s60hgjz1akqg", "cm8ose0yx001es60hhk8atx6o"], "🤔": ["cm7nx40e20005s60hqluumzai", "cm6thw30g0008s60hkrj1wnge"]}	2025-03-21 10:31:46.885	2025-03-21 10:31:46.885	[]
cm8oqsa2j0016s60hnnhvbafd	cm8oli66z0005s60hee9a2ejd	\N	Carrier configured delivery management options	{}	{"😍": ["cm8esf3rq000ys60hv7l3k2vy", "cm8oli66z0005s60hee9a2ejd", "cm8nddqq20004s60hrpowzwtd"]}	2025-03-25 17:00:46.459	2025-03-25 17:00:46.459	[]
cm8iwaq6p0012s60hkam4y9d0	cm7nx40e20005s60hqluumzai	\N	Narrow search results	{}	{"😍": [], "🤔": ["cm7uu06ge0010s60hmocr9lu5"]}	2025-03-21 14:48:28.177	2025-03-21 14:48:28.177	[]
cmal51gwc0004s60hfx9h3vq2	cm71zq1uu0000s60hsrg9iv1g	\N	Concept for combining search and deep research. #shop #origami	{shop,origami}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm7z93nvr0004s60hcxgjwyln", "cmayas4m80000s60hak1nw5k4", "cm84lb2sn0000s60hqn6v7ogq", "cmebusyao000as60odsdny6do"]}	2025-05-12 13:48:09.804	2025-05-12 13:48:09.804	[]
cm8f1qlar004as60hueo20tcs	cm8exr4mq003qs60hcxg1wm7v	\N	#Collabs Creator App, Opening a gift from a merchant.	{Collabs}	{"😍": ["cm8en5db7002ws60hbj8h20c5", "cm8exr4mq003qs60hcxg1wm7v", "cm7uu06ge0010s60hmocr9lu5", "cm8ejbj6l000ys60h8f353fxd", "cm8ejkt910018s60httxfcf76", "cm7nx40e20005s60hqluumzai", "cm8g5dsmz000ts60hk4913ehy", "cm7whzxin000fs60hky65yi4a", "cm7tp7xd4000gs60h1hu9598i", "cm8eu7rma002ss60hly65jbvi", "cm71zq1uu0000s60hsrg9iv1g", "cm8eqh9wo0002s60htqsgawqh", "cm8eoxq7i003gs60h9clhrv79", "cm8ehkmog000ds60hzu5pshdp", "cm8j0qlds001rs60hy6k9txuj", "cm8empxpm002ps60hwnc2iw1z", "cm7oyhrpy0000s60hp7oifrws", "cm8n6hq410007s60h9j7ivkby"], "🤔": ["cm7nx40e20005s60hqluumzai"]}	2025-03-18 22:09:41.716	2025-03-18 22:09:41.716	[]
cmflcoe63000as60hg99z4iyh	cm8erozd20005s60h3n1u3taw	\N	Project Runway iOS App - Input Explorations	{}	{"😍": ["cmesx6ypb0001s60h7oor91x8", "cm8ei0oz5000hs60hf1b48fw9"]}	2025-09-15 16:40:28.347	2025-09-15 16:40:28.347	[]
cm8es4g04000ps60haqa4jm7t	cm7nx40e20005s60hqluumzai	\N	Collection picture-in-picture	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm8eqiaqa0004s60h5jnuu2om", "cm7oyhrpy0000s60hp7oifrws", "cm8exr4mq003qs60hcxg1wm7v", "cm8ejbj6l000ys60h8f353fxd", "cm8nk5rtq0002s60harmh7mlq"], "🤔": ["cm7uu06ge0010s60hmocr9lu5", "cm7nx40e20005s60hqluumzai"]}	2025-03-18 17:40:31.876	2025-03-18 17:40:31.876	[]
cm8nw86310001s60hf5vw23p3	cm8em6fwr002fs60h69moo9ct	\N	Talent Patch Notes Doodle for Patch 25.1. Inspired by Flappy Bird. Built in Rive.	{}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm8etdrpr0022s60ho61sbpqb", "cm6zjpx940000s60h8whb0img", "cm7uzjhwo0001s60ht1tuhtfi", "cm8gb1wkz0004s60hqv6vpj7q", "cm7w8lz2d0001s60h7m7vk072", "cm8eo58zt0036s60ht4c3mf3x", "cm8esf3rq000ys60hv7l3k2vy", "cm8egfitt0001s60hr9zydwp1", "cm8ek25cp001js60ht0j4wini", "cm8qexwwn001ts60hr3hg0voe", "cm8ekcp8f001ms60hv6zkh8lq", "cm8rqazgb0009s60h0qf5rdbj", "cm7v5oid90000s60hen2v9rg2", "cm864b3pp0000s60huf1fmkg0"]}	2025-03-25 02:45:19.693	2025-03-25 02:45:19.693	[]
cm8je556p002rs60hip197318	cm8etdrpr0022s60ho61sbpqb	\N	Lil hover detail on Sidekick voice mode button\n\n#growth #sidekick	{growth,sidekick}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm8ei0oz5000hs60hf1b48fw9", "cm8elwpq9002bs60hedm3l2yj", "cm8etdrpr0022s60ho61sbpqb", "cm8ggdz9b0000s60hm651eb4x", "cm8esf3rq000ys60hv7l3k2vy", "cm8er27yw0000s60h8ewpyq20", "cm8ixpljw001es60hqdbihh7p"], "🤔": ["cm71zq1uu0000s60hsrg9iv1g", "cm6thw30g0008s60hkrj1wnge", "cm7v5oid90000s60hen2v9rg2"]}	2025-03-21 23:08:00.769	2025-03-21 23:08:00.769	[]
cm7z871iw0001s60hnn5oaf9z	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Fenty Quiz result animations \n\nWorked with @ashley.legiadre on the UI	{}	{"😍": ["cm7lyry250000s60hl4e0yfts"], "🤔": ["cm8qh4cg2002is60h5ps3zrph"]}	2025-03-07 20:26:08.12	2025-03-07 20:26:08.12	[{"userId": "cm7yx5dc50000s60hlu2jxmg4", "username": "ashley.legiadre", "displayName": "ashley.legiadre"}]
cm8ni3f0r000hs60h8ps67p8a	cm8ejkqci0017s60h1da0ulse	\N	From a series of ads directing folks to the homepage. Built in 1x1, 16x9, 9x16\n#corecreative #homepage	{corecreative,homepage}	{"😍": ["cm8empxpm002ps60hwnc2iw1z", "cm8njlq6k0000s60hujvx2kbg", "cm8njyxfz0001s60he7u7qx91", "cm8j3b3je001vs60h1s728b28", "cm8ok0f7k0001s60hd2cmwhmj", "cm8eo58zt0036s60ht4c3mf3x", "cm8erl7u80003s60hebi0qrx1", "cm8ej4knm000rs60hcjl32a85", "cm6tpgqwl0000s60hwj4xjow3"]}	2025-03-24 20:09:43.371	2025-03-24 20:09:43.371	[]
cm8fzh13l000es60h3rda3os1	cm8ejkt910018s60httxfcf76	\N	Shoptalk 2025 out of home creative: Collab with @Kimball @Loren Blackman #upmarket	{upmarket}	{"😍": ["cm8ejkt910018s60httxfcf76", "cm8ek25cp001js60ht0j4wini", "cm8elru8h0028s60huygpj285", "cm8g72wee000vs60hmfyncobd", "cm8eqiaqa0004s60h5jnuu2om", "cm6zjpx940000s60h8whb0img", "cm71zq1uu0000s60hsrg9iv1g", "cm8hi0xco0001s60h0omgywsh", "cm8hiiwlc0004s60h9o1yozwa", "cm8ei2u30000is60hxldwf8tc", "cm8nht8y4000cs60ht7vq6rja", "cm8oy4oen0008s60hfw4zmxwy", "cm8rbzgo60004s60hgd4gn4tz"], "🤔": ["cm7nx40e20005s60hqluumzai"]}	2025-03-19 13:54:02.578	2025-03-19 13:54:02.578	[]
cm8rjvbnf001xs60haxekb9oq	cm8erl7u80003s60hebi0qrx1	\N	New PDP preview from Sell On Mobile growth team. This is meant to be a "check your work" feature while a merchant is filling out their product details. It throws upon load to show teach the interaction and how to re-access.\n\n#growth	{growth}	{"😍": ["cm8esf3rq000ys60hv7l3k2vy", "cm6zjpx940000s60h8whb0img", "cm8esfinv0010s60hye1l9kjh"]}	2025-03-27 16:10:29.691	2025-03-27 16:10:29.691	[]
cm8xn157k0004s60hpp9fgj6g	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Playing around with how we generate share assets for our DailyFits™️ mini\n\nRunwayml is wild 🤯\n\n#shop #mini	{shop,mini}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm8z0r4yx0003s60ha7qrmr58", "cm6tpgqwl0000s60hwj4xjow3"]}	2025-03-31 22:25:37.184	2025-03-31 22:25:37.184	[]
cm8iw38e6000ts60hjv5rftzd	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Making some turns on the intro screen for a Merch mini coming to a #Shop app near you...\n\n#mini	{Shop,mini}	{"😍": ["cm8erl7u80003s60hebi0qrx1", "cm8j3b3je001vs60h1s728b28", "cm8o9znkh0000s60hd5emhds8", "cm8ok0f7k0001s60hd2cmwhmj"], "🤔": ["cm7nx40e20005s60hqluumzai"]}	2025-03-21 14:42:38.526	2025-03-21 14:42:38.526	[]
cm8or0etc0019s60h2paltecq	cm8oli66z0005s60hee9a2ejd	\N	New map-based delivery tab experience. #tracking	{tracking}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm71zq1uu0000s60hsrg9iv1g", "cm8oli66z0005s60hee9a2ejd", "cm6thw30g0008s60hkrj1wnge"]}	2025-03-25 17:07:05.857	2025-03-25 17:07:05.857	[]
cm97fsd8t0001s60h41j39fu5	cm7nx40e20005s60hqluumzai	\N	Branded search for non Shopify merchants	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5"]}	2025-04-07 19:00:32.14	2025-04-07 19:00:32.14	[]
cm9bg2h4b0001s60hd0oa3ccf	cm7z93nvr0004s60hcxgjwyln	\N	Exploration of a customer account owned web component on the storefront.	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm6zewlv30000s60hiwupvnso", "cm71zq1uu0000s60hsrg9iv1g", "cm8ei0oz5000hs60hf1b48fw9", "cm8eo39uq0034s60h5u7p5py4"]}	2025-04-10 14:19:28.427	2025-04-10 14:19:28.427	[]
cmampeb1q0001s60hz864bwoi	cm8ei2u30000is60hxldwf8tc	\N	Home card entry point to Shopify Payments + Balance KYC, made with Fig + Kling in fal.ai #admin #payments	{admin,payments}	{"😍": ["cm84lb2sn0000s60hqn6v7ogq", "cm8erozd20005s60h3n1u3taw", "cm7z93nvr0004s60hcxgjwyln", "cm6thw30g0008s60hkrj1wnge"]}	2025-05-13 16:05:47.246	2025-05-13 16:05:47.246	[]
cm8zw9umz0001s60ha5uyvgnv	cm8ei2u30000is60hxldwf8tc	\N	Payment method cards #payments #admin	{payments,admin}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm7uzjhwo0001s60ht1tuhtfi", "cm8iv1f4o0006s60hbu5l5lhs", "cm8erl7u80003s60hebi0qrx1", "cm6tofeoq0000s60htca0gvcm", "cm9a4uiz50000s60h9etzsbuf", "cm8emt3u4002qs60hvpyias29"]}	2025-04-02 12:19:52.283	2025-04-02 12:19:52.283	[]
cmbfaj5dr0008s60hf4jw6xn6	cm8hvl42z0004s60h4v1352m9	\N	One of the hero header animations for the Checkout kit page.	{}	{"😍": ["cm8ejkqci0017s60h1da0ulse"]}	2025-06-02 16:14:58.047	2025-06-02 16:14:58.047	[]
cm97ful3l0007s60hva67wphh	cm7nx40e20005s60hqluumzai	\N	Universal Product Identifier result (multiple retailers)	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm7nx40e20005s60hqluumzai", "cm8eqiaqa0004s60h5jnuu2om"]}	2025-04-07 19:02:15.634	2025-04-07 19:02:15.634	[]
cm9n58lwb0001s60h91omhk59	cm8ei0oz5000hs60hf1b48fw9	\N	Little detail for a rev on our Theme index\n\n#growth	{growth}	{"😍": ["cm8ehf1b0000cs60hd4ja2348", "cm8erl7u80003s60hebi0qrx1", "cm7jke4p00003s60hauy0agm1", "cm8ggdz9b0000s60hm651eb4x", "cm8elwpq9002bs60hedm3l2yj", "cm6zjpx940000s60h8whb0img", "cmecnv3tu0001s60hc1rs2izz"]}	2025-04-18 18:49:32.891	2025-04-18 18:49:32.891	[]
cmek62iz80007s60h773yg3o5	cm8ysolaf0000s60h165ztlk4	\N	Plus differentiation — OC, mobile	{}	{"😍": ["cmebuwlpn000qs60hhed41i28", "cm8et973x0021s60hr0vv4y5r"]}	2025-08-20 16:08:01.94	2025-08-20 16:08:01.94	[]
cm8rsu22q000ns60h2j9d1gz8	cm7uu06ge0010s60hmocr9lu5	\N	Shop App - Quick experiment using GPT's new image modal to create cover images for our user generated collections. This was a super simple process, just a quick screenshot of the collection + basic prompt... #shop #ai #collections	{shop,ai,collections}	{"😍": ["cm8ru7ucd0003s60hm5kqwdqq", "cm8ei0oz5000hs60hf1b48fw9", "cm6thw30g0008s60hkrj1wnge", "cm8erl7u80003s60hebi0qrx1", "cm8esf3rq000ys60hv7l3k2vy", "cm6tpgqwl0000s60hwj4xjow3", "cm6zewlv30000s60hiwupvnso", "cm8esof46001cs60hm8sbabdj", "cm9a8iy7w0000s60hfq6eandz", "cma75lbux0000s60hdfgkglk0"]}	2025-03-27 20:21:27.171	2025-03-27 20:21:27.171	[]
cm8rkb1tr0026s60he0ouzo33	cm8erl7u80003s60hebi0qrx1	\N	Home re-design concept that Joy Panjaitan, Amy Szatkowski and I put together for Hackdays. This concept was meant to explore new UI and focused UX surrounding dynamic nav, order recapture and community. \n\n#growth #core #hackdays	{growth,core,hackdays}	{"😍": ["cm8esf3rq000ys60hv7l3k2vy", "cm6zjpx940000s60h8whb0img", "cm7jke4p00003s60hauy0agm1", "cm84lb2sn0000s60hqn6v7ogq", "cm8esfinv0010s60hye1l9kjh"]}	2025-03-27 16:22:43.455	2025-03-27 16:22:43.455	[]
cmfl3v29f0002s60h7w9rbtcg	cm8ei2u30000is60hxldwf8tc	\N	Adding documents in centralized KYC	{}	{"😍": ["cm8erozd20005s60h3n1u3taw", "cmamkf2js0000s60hjoasfxp1"]}	2025-09-15 12:33:42.964	2025-09-15 12:33:42.964	[]
cmfhdodz70001s60h2i0ylpvc	cm8erozd20005s60h3n1u3taw	\N	Info card on Finance Home showing total balance, available and pending funds broken down by currency and account via hover states and interaction patterns. This was done as part of the One Shopify Balance project. 	{}	{"😍": ["cm8ei2u30000is60hxldwf8tc"]}	2025-09-12 21:57:23.011	2025-09-12 21:57:23.011	[]
cmdt2n7zd0004s60hzgh3lzsy	cmdt2ktmx0002s60hxwxkkzyk	\N	Some logo riff created with ChatGPT and After Effects <3	{}	{"😍": ["cmapmfqcc0000s60h0z2sqlo2", "cmed16vi2000os60hdoyvjft1", "cmb7xfdd30002s60ho2xxkl1w", "cm8etyse8002js60htgrx9qai", "cmesx6ypb0001s60h7oor91x8", "cm8ejlo910019s60hgjz1akqg", "cm8hfo85u0002s60hrw71e8v4", "cmf2s9hoe0002s60hjnav3bor", "cmf2s9la30004s60hxnfnqget", "cm8ej63t6000ss60h99hkq1b2", "cmf2sbwyu0006s60h7jd9ud7g", "cm8ei0oz5000hs60hf1b48fw9"]}	2025-08-01 17:02:22.249	2025-08-01 17:02:22.249	[]
cmaec1o110001s60h648ju8j2	cm7uu06ge0010s60hmocr9lu5	\N	Going wide on some explore page concepts. This one is feeling fun and wanted to share... jamming w/ @JoshMeyerOnFire & @annabel.lake\n\n#shop #concept	{shop,concept}	{"😍": ["cm7z93nvr0004s60hcxgjwyln", "cm8exy3ag003ss60h1u4aju6q", "cm8eqiaqa0004s60h5jnuu2om"]}	2025-05-07 19:29:53.125	2025-05-07 19:29:53.125	[{"userId": "cm8ehkmog000ds60hzu5pshdp", "username": "annabel.lake", "displayName": "annabel.lake"}]
cmg18944j0002s60hckylh1qm	cm71zq1uu0000s60hsrg9iv1g	\N	Exploring new nav patterns for Shop. #shop #origami	{shop,origami}	{"😍": ["cm8et181v001qs60hjqt3qupa", "cm7z93nvr0004s60hcxgjwyln", "cm8hfo85u0002s60hrw71e8v4", "cmf2s9la30004s60hxnfnqget", "cm8ei0oz5000hs60hf1b48fw9"]}	2025-09-26 19:20:55.843	2025-09-26 19:20:55.843	[]
cma2jgyfh0004s60hc75iumh6	cm8ei9oo7000ms60hkcdl4q7z	\N	Material and Post treatment for our presence at this year Collect-a-con in Chicago\n\n#brand #bae #brandcreative #blender	{brand,bae,brandcreative,blender}	{"😍": ["cm8eo1p0x0031s60hafze9b31", "cm8ok0f7k0001s60hd2cmwhmj", "cm7uu06ge0010s60hmocr9lu5", "cm8ekjy21001os60hsk8ue62t", "cm8ej63t6000ss60h99hkq1b2", "cm8erozd20005s60h3n1u3taw", "cm8eo86ln0039s60hifbofb7z", "cm8eo58zt0036s60ht4c3mf3x", "cm8hvl42z0004s60h4v1352m9", "cm8eqiaqa0004s60h5jnuu2om", "cmfxop3s00000s60h42rhp3hd"]}	2025-04-29 13:24:29.645	2025-04-29 13:24:29.645	[]
cmfyboneh0001s60h4d50jd6u	cm8ei0oz5000hs60hf1b48fw9	\N	From the archives: Pricing plan proto with adjustable pricing. #growth\n\nhttps://ntb-bit-buttons.quick.shopify.io/	{growth}	{"😍": ["cm7z93nvr0004s60hcxgjwyln", "cm8etyse8002js60htgrx9qai", "cm8iuzb3n0005s60hnmme2v1y", "cm8ejlo910019s60hgjz1akqg"]}	2025-09-24 18:33:40.985	2025-09-24 18:33:40.985	[]
cmhpae9eb0004s60h21xxu4ga	cm8ei0oz5000hs60hf1b48fw9	\N	Exploring ways to bring a little delight to our $1 trial screens.\n\nhttps://signup-overhaul.quick.shopify.io\n\nHigh five to anyone that picks up the movie reference in the tool. #growth	{growth}	{"😍": ["cm8oout7h000ss60hf7p2d45b", "cm6tpgqwl0000s60hwj4xjow3", "cm864b3pp0000s60huf1fmkg0"]}	2025-11-07 20:07:05.747	2025-11-07 20:07:05.747	[]
cm8ektf3w001xs60h6gqh4sv2	cm8ek25cp001js60ht0j4wini	\N	Checkout and accounts editor - Customization preview. 	{}	{"😍": ["cm7z8n3im0003s60hurlp3xkp", "cm8ekcp8f001ms60hv6zkh8lq", "cm7z9l7jf000bs60hg2j29tcc", "cm6zewlv30000s60hiwupvnso", "cm8en5els002xs60h8xxuak16", "cm8ei2u30000is60hxldwf8tc", "cm8eqiaqa0004s60h5jnuu2om", "cm8eu7rma002ss60hly65jbvi", "cmebusvf9001ns60hfbqadrlj", "cm8ja4w3o0023s60hbt09e04b"]}	2025-03-18 14:16:00.189	2025-03-18 14:16:00.189	[]
cmbfjd9w60001s60hmqqfczup	cm8hvl42z0004s60h4v1352m9	\N	Shoppy trophy for Summer Editions - Horizons Driving game	{}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm8empxpm002ps60hwnc2iw1z", "cm8elt5yz0029s60hc2wwhebn", "cm8yy2ngo0002s60hqqno3iac", "cm8ejkqci0017s60h1da0ulse", "cm8nk5rtq0002s60harmh7mlq", "cm8el1bj50020s60hty74lkf9"]}	2025-06-02 20:22:20.502	2025-06-02 20:22:20.502	[]
cmg1bbyik0001s60h1hy9nswr	cm7uzjhwo0001s60ht1tuhtfi	\N	Concept from this week: sell for me opportunities pushed from agent to merchant + streaming experience of agent actions and merchant actions	{}	{"😍": ["cmesx6ypb0001s60h7oor91x8"]}	2025-09-26 20:47:07.388	2025-09-26 20:47:07.388	[]
cmfydx5h40001s60hz4338212	cm7z93nvr0004s60hcxgjwyln	\N	Customer accounts sign in exploration. https://sign-in.quick.shopify.io/	{}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm8en5els002xs60h8xxuak16", "cm8hv4w290000s60huatd0mjt"]}	2025-09-24 19:36:16.888	2025-09-24 19:36:16.888	[]
cmg70bj390004s60hx69d4izx	cm7uzjhwo0001s60ht1tuhtfi	\N	growth dial concept – set a speed for an agent to work with to generate shop campaigns 	{}	{"😍": ["cm8emt3u4002qs60hvpyias29"]}	2025-09-30 20:25:28.677	2025-09-30 20:25:28.677	[]
cmg6q85kt0001s60hfv8marde	cm7uzjhwo0001s60ht1tuhtfi	\N	orders today widget	{}	{"😍": ["cm8emt3u4002qs60hvpyias29"]}	2025-09-30 15:42:55.037	2025-09-30 15:42:55.037	[]
cmflcf2z80004s60h2nwxlt1e	cm8erozd20005s60h3n1u3taw	\N	Project Runway iOS App - Navigation Explorations	{}	{"😍": ["cm8ixpljw001es60hqdbihh7p", "cm8hfo85u0002s60hrw71e8v4", "cm8emt3u4002qs60hvpyias29"]}	2025-09-15 16:33:13.941	2025-09-15 16:33:13.941	[]
cmi7sd0iv0001s60hsntwbtq0	cm8em7a7t002hs60hx8lnfgo3	\N	Drag and drop creation for batches on the orders index. 	{}	{"😍": ["cm8fzkskb000hs60h2sfnj4xm", "cm8eozabi003hs60hwv83es2p", "cm7uzjhwo0001s60ht1tuhtfi", "cm9r63ydr0000s60hlp5k3pxk", "cm8egfasb0000s60h8emeqkln", "cm8fxsj4k0004s60hbfp7mlbp"]}	2025-11-20 18:49:51.847	2025-11-20 18:49:51.847	[]
cmevpg6290004s60h4240q55g	cm8ei2u30000is60hxldwf8tc	\N	Micro-details of the Noodles Figma plugin UI, now with Chef Mode™!\n\nGive it a whirl:\nhttps://www.figma.com/community/plugin/1509719253635653417/noodles	{}	{"😍": ["cm8et181v001qs60hjqt3qupa", "cm6thmum10000s60hsx8v27ie"]}	2025-08-28 17:55:59.025	2025-08-28 17:55:59.025	[]
cme2x9swb0001s60h7uli0ke4	cm8hfo85u0002s60hrw71e8v4	\N	Onboarding quiz for new merchants	{}	{"😍": ["cm8ejgprk0011s60hb2n69yfm", "cm8ei0oz5000hs60hf1b48fw9", "cmebusn6j000os60hls7nj0aj", "cm8rlakxz002cs60hccushqgl", "cm8etyse8002js60htgrx9qai", "cm8ixpljw001es60hqdbihh7p", "cmesx6ypb0001s60h7oor91x8", "cm8ejlo910019s60hgjz1akqg", "cm8eo39uq0034s60h5u7p5py4", "cm8nddqq20004s60hrpowzwtd", "cm8elwpq9002bs60hedm3l2yj"]}	2025-08-08 14:29:39.851	2025-08-08 14:29:39.851	[]
cm98u7mtx0001s60h857lgly7	cm8z5x2kb0001s60hw0k73kfa	\N	Hero Rive Animation for /inventory-management product landing page (https://www.shopify.com/inventory-management).\n\nHas a slight hover interaction at the beginning too!	{}	{"😍": ["cm8rhek7o001as60hzogefgik", "cm8j3b3je001vs60h1s728b28", "cm8empxpm002ps60hwnc2iw1z", "cm8ei0oz5000hs60hf1b48fw9", "cm8g4oj1z000ss60hol8inmil", "cm8el1bj50020s60hty74lkf9", "cm8ei2u30000is60hxldwf8tc", "cm8ndcbs80003s60hxb80e6tc", "cm8ejlo910019s60hgjz1akqg", "cm8emt3u4002qs60hvpyias29", "cm8ga0f7c0001s60hyzrr3mpz", "cm8hn2wd20001s60hue7xwfs0", "cm9r63ydr0000s60hlp5k3pxk", "cm9slr1cq0000s60h7gt2sh4h", "cm8eqiaqa0004s60h5jnuu2om", "cm8q6u6gc0005s60hmviihgz2", "cm8ejkt910018s60httxfcf76", "cm8esi6pm0016s60hjjebqdrq"]}	2025-04-08 18:32:05.205	2025-04-08 18:32:05.205	[]
cmar2s2al0001s60h3rom8kvn	cm8ei0oz5000hs60hf1b48fw9	\N	Reveal transition for AI theme generation. All done with CSS/JS - no libraries. Play with the tool I built - https://theme-gen-reveal.vercel.app\n\n#growth	{growth}	{"😍": ["cm8eq9rrd004as60h7in8f922"]}	2025-05-16 17:31:28.797	2025-05-16 17:31:28.797	[]
cmd91ftrj0001s60heh2yv0q7	cm6thw30g0008s60hkrj1wnge	\N	Oldie but goodie #shop	{shop}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm8egwen60008s60h4d235z20", "cm7lyry250000s60hl4e0yfts", "cm8ejkqci0017s60h1da0ulse", "cm8ellt0w0026s60hg85woimb", "cmecwzmjf000bs60hcmp2dpx9", "cm8ei0oz5000hs60hf1b48fw9", "cm6thw30g0008s60hkrj1wnge", "cm97eexj40000s60h9oerv3n8"], "🤔": ["cm6thw30g0008s60hkrj1wnge"]}	2025-07-18 16:33:14.095	2025-07-18 16:33:14.095	[]
cm90dguis0007s60hrc85mkbv	cm8elt5yz0029s60hc2wwhebn	\N	Shopify x Wyn social asset teasing an upcoming pop up with Wyn Beauty by Serena Williams.\n\n#brand #brandcreative #partnerships	{brand,brandcreative,partnerships}	{"😍": ["cm8ok0f7k0001s60hd2cmwhmj", "cm8eo1p0x0031s60hafze9b31", "cm7uu06ge0010s60hmocr9lu5", "cm8ei2u30000is60hxldwf8tc", "cm8eqiaqa0004s60h5jnuu2om", "cm7uzjhwo0001s60ht1tuhtfi", "cm8erl7u80003s60hebi0qrx1", "cm8eozabi003hs60hwv83es2p", "cm71zq1uu0000s60hsrg9iv1g", "cm6tofeoq0000s60htca0gvcm", "cm8ei0oz5000hs60hf1b48fw9", "cm6zewlv30000s60hiwupvnso", "cm8nht8y4000cs60ht7vq6rja", "cm8ekjy21001os60hsk8ue62t", "cm7jke4p00003s60hauy0agm1", "cm8ej63t6000ss60h99hkq1b2", "cm8eo86ln0039s60hifbofb7z", "cm8hvl42z0004s60h4v1352m9"]}	2025-04-02 20:21:12.197	2025-04-02 20:21:12.197	[]
cmaya0qbe0001s60hve0x07u3	cm7yx5dc50000s60hlu2jxmg4	\N	minis	{}	{"😍": ["cm7lyry250000s60hl4e0yfts", "cm8ei0oz5000hs60hf1b48fw9", "cm6thw30g0008s60hkrj1wnge", "cm8eo1p0x0031s60hafze9b31", "cmebuwlpn000qs60hhed41i28", "cm97eexj40000s60h9oerv3n8"]}	2025-05-21 18:28:33.722	2025-05-21 18:28:33.722	[]
cmedcg6ry0002s60haalxq9gw	cm84lb2sn0000s60hqn6v7ogq	\N	Concept for more visual configuration panel. Illustrations by @dan.rohr\n\n#analytics #admin	{analytics,admin}	{"😍": ["cm8ejcicz000zs60hjy10f6j3", "cmapmfqcc0000s60h0z2sqlo2", "cm8f7bgm30000s60hppdd0h38"]}	2025-08-15 21:32:13.774	2025-08-15 21:32:13.774	[{"userId": "cm9a4uiz50000s60h9etzsbuf", "username": "dan.rohr", "displayName": "dan.rohr"}]
cm8fz9bh5000bs60h01qrx6vi	cm8fyv6xs0007s60h8mmy9uqd	\N	Top Nav → SuperSidebar™	{}	{"😍": ["cm8ev050c003fs60hl2cyyugr", "cm8g9vp400000s60hnwzkrtd1", "cm8fyv6xs0007s60h8mmy9uqd", "cm6zjpx940000s60h8whb0img"], "🤔": ["cm7nx40e20005s60hqluumzai", "cm7v5oid90000s60hen2v9rg2", "cm6tofeoq0000s60htca0gvcm"]}	2025-03-19 13:48:02.777	2025-03-19 13:48:02.777	[]
cmdzaa54b0001s60h0e3ono5k	cm8eo39uq0034s60h5u7p5py4	\N	Concept for redesigning the cart to checkout experience	{}	{"😍": ["cm8en5els002xs60h8xxuak16", "cm864b3pp0000s60huf1fmkg0", "cm8epbkwd003qs60h1nfu93ph", "cmebutzv7003cs60h1g79lu0o", "cm84lb2sn0000s60hqn6v7ogq"]}	2025-08-06 01:22:45.995	2025-08-06 01:22:45.995	[]
cmf4bpqz40004s60h1gij2msr	cmabnm4fs0000s60hiyjquj3k	\N	Evergreen social ad for Shop feat. motion by @erich.reimers 	{}	{"😍": ["cm7lyry250000s60hl4e0yfts", "cm6thw30g0008s60hkrj1wnge", "cm9tyb4ci0000s60hl6o3vv62", "cm8ixpljw001es60hqdbihh7p", "cm7z93nvr0004s60hcxgjwyln", "cm84lb2sn0000s60hqn6v7ogq", "cm97eexj40000s60h9oerv3n8"], "🤔": []}	2025-09-03 18:41:26.992	2025-09-03 18:41:26.992	[{"userId": "cm7wbitsi000cs60hq1jnj3px", "username": "erich.reimers", "displayName": "erich.reimers"}]
cmb5awep50001s60h86etqtlo	cm8el1bj50020s60hty74lkf9	\N	Summer Editions trailer w/ motion by Ronald Rabideau with creative direction by Steph Chan. SFX by Alex Viau.	{}	{"😍": ["cm8oj7wf20000s60hx3gsm03n", "cmazmkysl0000s60hp78pta2s", "cm8el1bj50020s60hty74lkf9", "cm7lyry250000s60hl4e0yfts", "cm7z9l7jf000bs60hg2j29tcc", "cm71zq1uu0000s60hsrg9iv1g", "cm6thw30g0008s60hkrj1wnge", "cm8hvl42z0004s60h4v1352m9", "cm87e0fpo0000s60ha7hoh1rr", "cm8ek16ru001hs60hbior11iu", "cm8gb1wkz0004s60hqv6vpj7q", "cm8ehy4x1000gs60h8219dozk", "cmbi8jswz0000s60hewx232ms", "cm8emd06d002ks60h2409ys0r", "cm8ei0oz5000hs60hf1b48fw9", "cm8empxpm002ps60hwnc2iw1z", "cm8ejkt910018s60httxfcf76", "cmapmfqcc0000s60h0z2sqlo2", "cm8j3b3je001vs60h1s728b28", "cm8ejlo910019s60hgjz1akqg", "cmg17bxfr0000s60hzi42vlms"]}	2025-05-26 16:27:34.889	2025-05-26 16:27:34.889	[]
cmh54bqp60001s60hnosq5yan	cm8egwen60008s60h4d235z20	\N	empty state w/ Erich Reimers	{}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm7uu06ge0010s60hmocr9lu5", "cmesx6ypb0001s60h7oor91x8", "cm7lyry250000s60hl4e0yfts", "cmg17bxfr0000s60hzi42vlms"], "🤔": ["cmf2sbwyu0006s60h7jd9ud7g"]}	2025-10-24 17:21:46.986	2025-10-24 17:21:46.986	[]
cmg0zroof0003s60hplc820tk	cm8nk5rtq0002s60harmh7mlq	\N	new icon for iOS 26	{}	{"😍": ["cm8ev050c003fs60hl2cyyugr", "cmg13l7av0003s60hnue3perd", "cm8g7n07x000xs60hext20mbs", "cmesx6ypb0001s60h7oor91x8", "cmbb73w2a0000s60h1voeqx5y", "cm8et181v001qs60hjqt3qupa"]}	2025-09-26 15:23:25.743	2025-09-26 15:23:25.743	[]
cmf349reg0001s60h9fxl6ie5	cm8en4hyg002vs60hx2hpkngb	\N	Personalizing the Shop pay button with @Sarah Kim	{}	{"😍": ["cmabnm4fs0000s60hiyjquj3k", "cm6thw30g0008s60hkrj1wnge", "cm9tyb4ci0000s60hl6o3vv62", "cmfgydq710001s60h8y09ntth", "cm7z93nvr0004s60hcxgjwyln"]}	2025-09-02 22:25:17.56	2025-09-02 22:25:17.56	[]
cmgfe5zup0001s60h2t97wg7m	cm8esf3rq000ys60hv7l3k2vy	\N	Drag and drop hover	{}	{"😍": ["cm8emt3u4002qs60hvpyias29", "cmebuszze0008s60hw41o8zc2", "cmf2s9la30004s60hxnfnqget"]}	2025-10-06 17:15:14.496	2025-10-06 17:15:14.496	[]
cm8hvavzo0002s60ht2aeqs06	cm8eo1etv0030s60hwtdzr22r	\N	POC for some Creative Platform exploration with the Retail Creative crew!\n	{}	{"😍": ["cm8eqiaqa0004s60h5jnuu2om", "cm8ei2u30000is60hxldwf8tc", "cm8ejkt910018s60httxfcf76", "cm8ok0f7k0001s60hd2cmwhmj", "cm8hi0xco0001s60h0omgywsh", "cm8emd06d002ks60h2409ys0r"], "🤔": ["cm7nx40e20005s60hqluumzai"]}	2025-03-20 21:32:49.909	2025-03-20 21:32:49.909	[]
cm8ejj5ki0013s60hd8277ucs	cm7xlifn90000s60hihjg8d5q	\N	Old proof of concept for the POS brochure hero (w/ @connell.mccarthy and @jose.silva) #retail	{retail}	{"😍": ["cm8ejkt910018s60httxfcf76", "cm7w8lz2d0001s60h7m7vk072", "cm8eklzmu001rs60hme7feqc3", "cm7thki660000s60hlrru9mhx", "cm8em7a7t002hs60hx8lnfgo3", "cm8eo1etv0030s60hwtdzr22r", "cm8eo86ln0039s60hifbofb7z", "cm8eozabi003hs60hwv83es2p", "cm8eoxq7i003gs60h9clhrv79", "cm8eqiaqa0004s60h5jnuu2om", "cm8eqqyjw0009s60hts0q80bu", "cm8esf3rq000ys60hv7l3k2vy", "cm8etyse8002js60htgrx9qai", "cm8ek25cp001js60ht0j4wini", "cm6zjpx940000s60h8whb0img", "cm8hi0xco0001s60h0omgywsh", "cm8hiiwlc0004s60h9o1yozwa", "cm8ej4knm000rs60hcjl32a85", "cm8emd06d002ks60h2409ys0r"]}	2025-03-18 13:40:01.65	2025-03-18 13:40:01.65	[{"userId": "cm7thki660000s60hlrru9mhx", "username": "connell.mccarthy", "displayName": "Connell"}]
cm7uthmme000vs60hrgjgzexn	cm7nm6s9j0000s60hxxf8hx4i	\N	Loading cart	{}	{"😍": ["cm8stdbcz0000s60hfqbddj7t", "cm8ru7ucd0003s60hm5kqwdqq", "cmeburzer000ds60hzqs3fx60", "cmapmfqcc0000s60h0z2sqlo2", "cmecs1s4n0000s60h06iv0lrh"]}	2025-03-04 18:23:23.078	2025-03-04 18:23:23.078	[]
cm9x8655g0001s60hih6kg8wx	cm8ekjy21001os60hsk8ue62t	\N	Remix of an April Fool's Day landing page that sadly did not make it to production. \nMidjourney used to create faux album covers ("Don't Abandon the Cart", "Launching Legends", etc). \nAnimated in Spline.\n#techflexes	{techflexes}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm8ok0f7k0001s60hd2cmwhmj", "cm8ej63t6000ss60h99hkq1b2"]}	2025-04-25 20:09:18.484	2025-04-25 20:09:18.484	[]
cmfcxl6gp0004s60h7q3tnx0m	cm7uzjhwo0001s60ht1tuhtfi	\N	line vs bar chart daily sales widgets 	{}	{"😍": ["cmf2s9hoe0002s60hjnav3bor", "cm6zewlv30000s60hiwupvnso", "cm8ixpljw001es60hqdbihh7p", "cm7z93nvr0004s60hcxgjwyln", "cmg17bxfr0000s60hzi42vlms"]}	2025-09-09 19:15:54.745	2025-09-09 19:15:54.745	[]
cm853knc50001s60hq3etfnjd	cm84lb2sn0000s60hqn6v7ogq	\N	Sidekick delivering analytics insights \n#admin	{admin}	{"😍": ["cm7w8g3650000s60h5rzvmqcw", "cm7z9l7jf000bs60hg2j29tcc", "cm7v5oid90000s60hen2v9rg2", "cm6zewlv30000s60hiwupvnso", "cm7wayd3g000bs60htgdbt3mm", "cm7waaezb0005s60hjxfkpznf", "cm8ejcicz000zs60hjy10f6j3", "cm8et973x0021s60hr0vv4y5r", "cm8ejlo910019s60hgjz1akqg", "cm8ei2u30000is60hxldwf8tc", "cm8onbupz000qs60hq5d3mdiz", "cm9u7dhwd0000s60hin5hui0w"], "🤔": ["cm6tofeoq0000s60htca0gvcm"]}	2025-03-11 23:03:21.893	2025-03-11 23:03:21.893	[]
cm9k6vn7f0001s60hqglwd9c2	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini team is launching Product Talk™️ this week! We needed a solution that enables users to choose from their favorite products and instantly create a podcast-style infomercial.\n\n#shop #mini\n\n@AshleyLegiadre w/ the feed card animation	{shop,mini}	{"😍": ["cm9r63ydr0000s60hlp5k3pxk", "cm8ekjy21001os60hsk8ue62t", "cm8eqiaqa0004s60h5jnuu2om", "cm7uu06ge0010s60hmocr9lu5", "cm8ok0f7k0001s60hd2cmwhmj", "cm6zewlv30000s60hiwupvnso"]}	2025-04-16 17:12:08.763	2025-04-16 17:12:08.763	[]
cm8yk9t2y0001s60hx9jl9osd	cm864b3pp0000s60huf1fmkg0	\N	Home Bento card exploration	{}	{"😍": ["cm7uu06ge0010s60hmocr9lu5", "cm84lb2sn0000s60hqn6v7ogq", "cm8ei0oz5000hs60hf1b48fw9", "cm7thki660000s60hlrru9mhx", "cm8erl7u80003s60hebi0qrx1", "cm8em6fwr002fs60h69moo9ct", "cm8ei2u30000is60hxldwf8tc", "cm8en5els002xs60h8xxuak16", "cm8emt3u4002qs60hvpyias29", "cm8eqh9wo0002s60htqsgawqh"]}	2025-04-01 13:56:08.698	2025-04-01 13:56:08.698	[]
cm930sj6e0001s60hukd1d96m	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Visual Search landing screen exploration #shop #mini	{shop,mini}	{"😍": ["cm8eo86ln0039s60hifbofb7z", "cm6tofeoq0000s60htca0gvcm", "cm8ei0oz5000hs60hf1b48fw9", "cm7z93nvr0004s60hcxgjwyln", "cm8el1bj50020s60hty74lkf9", "cm8ndcbs80003s60hxb80e6tc", "cm8ekjy21001os60hsk8ue62t", "cm8eqiaqa0004s60h5jnuu2om", "cm9vrb4zx0000s60hitqyfstn", "cm8elru8h0028s60huygpj285", "cm8ej63t6000ss60h99hkq1b2"]}	2025-04-04 16:49:40.886	2025-04-04 16:49:40.886	[]
cm91s6cqj0001s60hotgtv4zu	cm8ei2u30000is60hxldwf8tc	\N	Payment settings empty state #admin #payments	{admin,payments}	{"😍": ["cm84lb2sn0000s60hqn6v7ogq", "cm8esi6pm0016s60hjjebqdrq"]}	2025-04-03 20:00:43.003	2025-04-03 20:00:43.003	[]
cmay2w8dl0001s60hrpvc0u7j	cm8elt5yz0029s60hc2wwhebn	\N	Shopify x Wyn Pop-up announcement post feat. Serena Williams.\n\n#brand #brandcreative #partnerships	{brand,brandcreative,partnerships}	{"😍": ["cmayas4m80000s60hak1nw5k4", "cm7lyry250000s60hl4e0yfts", "cm8eo1p0x0031s60hafze9b31", "cm8eoxq7i003gs60h9clhrv79", "cm8emd06d002ks60h2409ys0r", "cm8ei2u30000is60hxldwf8tc", "cm8xb4iro0001s60hbzyuqq5y", "cm8hm62380000s60hdm8kycpv", "cmebuuely003ms60hfvn0zp4k", "cm8ja4w3o0023s60hbt09e04b", "cmehagh0a0008s60hefi36534", "cm8ejlo910019s60hgjz1akqg", "cmebuwlpn000qs60hhed41i28"]}	2025-05-21 15:09:06.537	2025-05-21 15:09:06.537	[]
cm8eqzpj4000js60hvqdwltqg	cm8eqiaqa0004s60h5jnuu2om	\N	One of the ads we created for the UI Extensions Campaign. This work was done in collaboration with Kate Icely, Jose Silva, and Connell McCarthy. \n\n#retail	{retail}	{"😍": ["cm7nx40e20005s60hqluumzai", "cm8erl7u80003s60hebi0qrx1", "cm6zjpx940000s60h8whb0img", "cm8etyse8002js60htgrx9qai", "cm8ejkc6h0015s60hpilouny1", "cm7v5oid90000s60hen2v9rg2", "cm8ejkt910018s60httxfcf76", "cm6zewlv30000s60hiwupvnso", "cm8eqsgiu000as60h0er9t580", "cm8hi0xco0001s60h0omgywsh", "cm8hiiwlc0004s60h9o1yozwa", "cm8ei2u30000is60hxldwf8tc", "cm8eqh9wo0002s60htqsgawqh", "cm8iv1f4o0006s60hbu5l5lhs", "cm8ivy2q7000is60hfk1iqbai", "cm8ndr8260008s60h1dcvija0", "cm8ek25cp001js60ht0j4wini", "cm8er27yw0000s60h8ewpyq20", "cm8rbzgo60004s60hgd4gn4tz", "cm8emd06d002ks60h2409ys0r", "cm6tofeoq0000s60htca0gvcm", "cm8hvl42z0004s60h4v1352m9"]}	2025-03-18 17:08:51.328	2025-03-18 17:08:51.328	[]
cmg882jfo0004s60h4srue915	cm8okkpn20004s60hi9twmhhm	\N	We're in the chat! #BDS #BrandDesignStudio	{BDS,BrandDesignStudio}	{"😍": ["cmf2s9la30004s60hxnfnqget", "cm8hvl42z0004s60h4v1352m9", "cm8hfo85u0002s60hrw71e8v4", "cm8el1bj50020s60hty74lkf9", "cm8nk5rtq0002s60harmh7mlq"]}	2025-10-01 16:50:12.325	2025-10-01 16:50:12.325	[]
cmd9cx9ki0001s60hztuvjab2	cm7uu06ge0010s60hmocr9lu5	\N	Playing with some more category menu options #shop	{shop}	{"😍": ["cm8egwen60008s60h4d235z20", "cmebusvf9001ns60hfbqadrlj", "cmebusm83000ks60h0njnl2oy", "cmesx6ypb0001s60h7oor91x8"], "🤔": []}	2025-07-18 21:54:43.506	2025-07-18 21:54:43.506	[]
cmhuw71ql0001s60h2r1nyhhs	cm8et181v001qs60hjqt3qupa	\N	File picker exploration from product detail page 	{}	{"😍": ["cm8ixpljw001es60hqdbihh7p"]}	2025-11-11 18:16:11.661	2025-11-11 18:16:11.661	[]
cmgb7t1e60001s60h8m7ligqn	cm8ysolaf0000s60h165ztlk4	\N	Home card illustration about Sidekick as an Evaluation tool for new merchants.	{}	{"🤔": ["cm71zq1uu0000s60hsrg9iv1g", "cmf2s9kxe0003s60hq1y96kpr", "cmf2sbwyu0006s60h7jd9ud7g"]}	2025-10-03 19:06:07.565	2025-10-03 19:06:07.565	[]
cm91o3eby0005s60hu8z13w36	cm8elt5yz0029s60hc2wwhebn	\N	Shopify x D'Amelio pop-up announcement post.\n\n#brand #brandcreative #partnerships	{brand,brandcreative,partnerships}	{"😍": ["cm8eo1p0x0031s60hafze9b31", "cm7oyhrpy0000s60hp7oifrws", "cm71zq1uu0000s60hsrg9iv1g", "cm84lb2sn0000s60hqn6v7ogq", "cm8el1bj50020s60hty74lkf9", "cm8ok0f7k0001s60hd2cmwhmj", "cm8elru8h0028s60huygpj285", "cm8ej63t6000ss60h99hkq1b2", "cm6tofeoq0000s60htca0gvcm", "cm8eo86ln0039s60hifbofb7z"]}	2025-04-03 18:06:26.639	2025-04-03 18:06:26.639	[]
cma2jjga6000as60hyptiho11	cm8ei9oo7000ms60hkcdl4q7z	\N	Material treatment for data points showcased on screens during this year Collect-a-con\n\n#brand #bae #brandcreative #blender	{brand,bae,brandcreative,blender}	{"😍": ["cm8eo1p0x0031s60hafze9b31", "cm8ok0f7k0001s60hd2cmwhmj", "cm84lb2sn0000s60hqn6v7ogq", "cm7uu06ge0010s60hmocr9lu5", "cm8ekjy21001os60hsk8ue62t", "cm8eo86ln0039s60hifbofb7z", "cm97eexj40000s60h9oerv3n8", "cmayas4m80000s60hak1nw5k4", "cmb5grl6d0000s60h9uvfd6ug", "cm8ek16ru001hs60hbior11iu", "cm8eqiaqa0004s60h5jnuu2om"]}	2025-04-29 13:26:26.094	2025-04-29 13:26:26.094	[]
cmf3os4gi0001s60hs2tng0t9	cm7okm0yo0000s60h4d4txvi3	\N	Playing with a little multi-select interaction for selecting preferred sizing attributes #shop	{shop}	{"😍": ["cm8et973x0021s60hr0vv4y5r", "cm6thw30g0008s60hkrj1wnge", "cm9tyb4ci0000s60hl6o3vv62", "cm7z93nvr0004s60hcxgjwyln"]}	2025-09-03 07:59:26.61	2025-09-03 07:59:26.61	[]
cm8q10ryx0003s60h394c6g7g	cm8ggdz9b0000s60hm651eb4x	\N	Animation when new tasks are added to the home guide when a merchant upgrades from Plus trial to the full plan. #growth	{growth}	{"😍": ["cm6zjpx940000s60h8whb0img", "cm8etdrpr0022s60ho61sbpqb", "cm8esf3rq000ys60hv7l3k2vy", "cm8pywdbz0001s60h9yteq3b8", "cm84lb2sn0000s60hqn6v7ogq", "cm8or5deb001bs60hsjg54hrx", "cm8rqtndo000ds60hxkkhwe6x", "cm8elwpq9002bs60hedm3l2yj", "cm8elru8h0028s60huygpj285", "cm7z8n3im0003s60hurlp3xkp"]}	2025-03-26 14:35:05.242	2025-03-26 14:35:05.242	[]
cm7uvegr20007s60h6w4zx11n	cm7uu06ge0010s60hmocr9lu5	\N	Shop Mini - Avatar outfit editing	{}	{"😍": ["cm6zewlv30000s60hiwupvnso", "cmaztncpn0000s60h4qitcgto"]}	2025-03-04 19:16:54.734	2025-03-04 19:16:54.734	[]
cm8ni4g9n000ks60hhxgs2m8m	cm8ejkqci0017s60h1da0ulse	\N	From a series of ads directing folks to the homepage. Built in 1x1, 16x9, 9x16\n#corecreative #homepage	{corecreative,homepage}	{"😍": ["cm8empxpm002ps60hwnc2iw1z", "cm8njlq6k0000s60hujvx2kbg", "cm8njyxfz0001s60he7u7qx91", "cm8j3b3je001vs60h1s728b28", "cm8ejkt910018s60httxfcf76", "cm8ok0f7k0001s60hd2cmwhmj", "cm8onbupz000qs60hq5d3mdiz", "cm8eo58zt0036s60ht4c3mf3x", "cm8eqx51d000hs60hmc6mel7r", "cm8erl7u80003s60hebi0qrx1", "cm8ej4knm000rs60hcjl32a85", "cm864b3pp0000s60huf1fmkg0", "cm8el1bj50020s60hty74lkf9", "cm6tpgqwl0000s60hwj4xjow3", "cm7yx5dc50000s60hlu2jxmg4", "cm8eqiaqa0004s60h5jnuu2om", "cm97eexj40000s60h9oerv3n8", "cm8esi6pm0016s60hjjebqdrq", "cm8ixpljw001es60hqdbihh7p", "cmavmbjez0000s60hacfjtkqa", "cm8ggdz9b0000s60hm651eb4x"]}	2025-03-24 20:10:31.643	2025-03-24 20:10:31.643	[]
cmeczk7y6000js60h9f2hapz1	cm7uzjhwo0001s60ht1tuhtfi	\N	scrap: playing around with this agentic campaign builder concept for shopify ads 	{}	{"😍": ["cm7zc3ylp0000s60hpc7gtlbl"]}	2025-08-15 15:31:26.91	2025-08-15 15:31:26.91	[]
cma2jkgrm000ds60hyv0a09ia	cm8ei9oo7000ms60hkcdl4q7z	\N	Animated content for screens within our booth at this year Collect-a-Con\n\n#brand #bae #brandcreative #blender	{brand,bae,brandcreative,blender}	{"😍": ["cm8eo1p0x0031s60hafze9b31", "cm8ok0f7k0001s60hd2cmwhmj", "cm7uu06ge0010s60hmocr9lu5", "cm8em6fwr002fs60h69moo9ct", "cm8erl7u80003s60hebi0qrx1", "cm8ekjy21001os60hsk8ue62t", "cm8ej63t6000ss60h99hkq1b2", "cm6tofeoq0000s60htca0gvcm", "cm84lb2sn0000s60hqn6v7ogq", "cm8erozd20005s60h3n1u3taw", "cm8eo86ln0039s60hifbofb7z", "cm8eo58zt0036s60ht4c3mf3x", "cm8hvl42z0004s60h4v1352m9", "cm87e0fpo0000s60ha7hoh1rr", "cm8emd06d002ks60h2409ys0r", "cm8eqiaqa0004s60h5jnuu2om"]}	2025-04-29 13:27:13.379	2025-04-29 13:27:13.379	[]
cmeu8g7810004s60hgch2qvxw	cm8et181v001qs60hjqt3qupa	\N	Mobile web file editor revamp 	{}	{"😍": ["cm8hfo85u0002s60hrw71e8v4", "cm8et181v001qs60hjqt3qupa", "cm8ev050c003fs60hl2cyyugr"]}	2025-08-27 17:12:20.882	2025-08-27 17:12:20.882	[]
cmbh09vvx0001s60hgz1j0ih0	cm8elg2lu0022s60hgrc845md	\N	From our Hackdays project: the Minecraft-inspired internal tool interface for Promptcraft. https://hackdays.shopify.io/projects/20349	{}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm8oy4oen0008s60hfw4zmxwy"]}	2025-06-03 21:03:22.029	2025-06-03 21:03:22.029	[]
cma2jiatz0007s60htno9u01e	cm8ei9oo7000ms60hkcdl4q7z	\N	Social assets for merchants and creator present at our booth for this year Collect-a-con\n\n#brand #bae #brandcreative #blender	{brand,bae,brandcreative,blender}	{"😍": ["cm8eo1p0x0031s60hafze9b31", "cm8ok0f7k0001s60hd2cmwhmj", "cm7uu06ge0010s60hmocr9lu5", "cm8ej63t6000ss60h99hkq1b2", "cm6zjpx940000s60h8whb0img", "cm8erl7u80003s60hebi0qrx1", "cm8ekjy21001os60hsk8ue62t", "cm6zewlv30000s60hiwupvnso", "cm8eo86ln0039s60hifbofb7z", "cm8eo58zt0036s60ht4c3mf3x", "cm8eqiaqa0004s60h5jnuu2om", "cmebuso4w000rs60hbea7p2oa"]}	2025-04-29 13:25:32.376	2025-04-29 13:25:32.376	[]
cme2w1g140001s60hqxkdbg22	cm8evlg2v003is60hhtx5a0l2	\N	Easter egg minigame for the footer of Shopify.dev!\n\n#shopifydev #docs	{shopifydev,docs}	{"😍": ["cm8ejx2oq001ds60hxfkse73w", "cmebusztt001zs60ha2hfpccv", "cmebusmsf000ms60hkc2dth14", "cmebuss2k0005s60odc38hyw0", "cmebuxwko0006s60hsk63nmxy", "cmebusvla001ps60hzdv3gqyj", "cm7uzjhwo0001s60ht1tuhtfi", "cm84lb2sn0000s60hqn6v7ogq", "cm8hiiwlc0004s60h9o1yozwa", "cmapmfqcc0000s60h0z2sqlo2", "cm8em6fwr002fs60h69moo9ct"]}	2025-08-08 13:55:10.312	2025-08-08 13:55:10.312	[]
cm91sd2t80004s60hj71x7r9a	cm8ei2u30000is60hxldwf8tc	\N	Payments empty state on desktop #admin #payments	{admin,payments}	{"😍": ["cm7uzjhwo0001s60ht1tuhtfi", "cm8iv1f4o0006s60hbu5l5lhs", "cm8erl7u80003s60hebi0qrx1", "cm7oyhrpy0000s60hp7oifrws", "cm8ejlo910019s60hgjz1akqg", "cm8fzkskb000hs60h2sfnj4xm", "cm8eqh9wo0002s60htqsgawqh", "cm7jke4p00003s60hauy0agm1", "cm8elwpq9002bs60hedm3l2yj", "cm8esi6pm0016s60hjjebqdrq", "cm8erozd20005s60h3n1u3taw", "cm7w6pvky000bs60hmb38qjbd"]}	2025-04-03 20:05:56.732	2025-04-03 20:05:56.732	[]
cmh2ajg7k0001s60hstsxspk6	cm7zc3ylp0000s60hpc7gtlbl	\N	https://volca.quick.shopify.io/\n\nI built a visual/audio synth web app inspired by analog volca beats drum machine.\ncreate sounds, play with the visuals and have fun!	{}	{"😍": ["cm7uzjhwo0001s60ht1tuhtfi", "cm84lb2sn0000s60hqn6v7ogq", "cm8ei0oz5000hs60hf1b48fw9"]}	2025-10-22 17:52:25.807	2025-10-22 17:52:25.807	[]
cmdg8kmrq0001s60hkil6wn71	cm8egwen60008s60h4d235z20	\N	archival footage: Shop onboarding concepts from a few months ago.	{}	{"😍": ["cm7lyry250000s60hl4e0yfts", "cm7yx5dc50000s60hlu2jxmg4", "cm6thw30g0008s60hkrj1wnge", "cmesx6ypb0001s60h7oor91x8", "cmg85whne0000s60h3nuk70o6"]}	2025-07-23 17:27:18.855	2025-07-23 17:27:18.855	[]
cmgfo4a6y0001s60htvruu214	cm7uzjhwo0001s60ht1tuhtfi	\N	today's revenue by channel widget 	{}	{"😍": ["cm8emt3u4002qs60hvpyias29", "cm9r7l1f10000s60hq8gvmecx", "cm8oout7h000ss60hf7p2d45b", "cm8ga0f7c0001s60hyzrr3mpz", "cm8et181v001qs60hjqt3qupa", "cm864b3pp0000s60huf1fmkg0", "cm6tofeoq0000s60htca0gvcm", "cmf2s9kxe0003s60hq1y96kpr", "cmf2s9la30004s60hxnfnqget"]}	2025-10-06 21:53:50.746	2025-10-06 21:53:50.746	[]
cmgfygpkg0004s60ht8kppm99	cm8em7a7t002hs60hx8lnfgo3	\N	Exploring patterns for navigating batch and order history from the index.  #admin #orders #batches	{admin,orders,batches}	{"😍": ["cm8ga0f7c0001s60hyzrr3mpz", "cm8ellt0w0026s60hg85woimb"]}	2025-10-07 02:43:26.705	2025-10-07 02:43:26.705	[]
cmflcy6q9000ds60hwg4bl937	cm8erozd20005s60h3n1u3taw	\N	Project Runway iOS App - AI Explorations	{}	{"😍": ["cmesx6ypb0001s60h7oor91x8", "cm7z93nvr0004s60hcxgjwyln", "cm8emt3u4002qs60hvpyias29"], "🤔": ["cmesx6ypb0001s60h7oor91x8"]}	2025-09-15 16:48:05.265	2025-09-15 16:48:05.265	[]
cmgedo4k40001s60hqgup0t3m	cm8esf3rq000ys60hv7l3k2vy	\N	Drag and drop store migration #growth	{growth}	{"😍": ["cm84lb2sn0000s60hqn6v7ogq", "cm8oout7h000ss60hf7p2d45b", "cm7z9l7jf000bs60hg2j29tcc", "cm6thmum10000s60hsx8v27ie", "cm8ei0oz5000hs60hf1b48fw9", "cm7waaezb0005s60hjxfkpznf", "cmh0oipgw0000s60hqwruhrm7", "cm8oy4oen0008s60hfw4zmxwy", "cmebuszze0008s60hw41o8zc2"], "🤔": ["cm6thmum10000s60hsx8v27ie", "cmf2sbwyu0006s60h7jd9ud7g"]}	2025-10-06 00:13:34.612	2025-10-06 00:13:34.612	[]
cmhp938m40001s60hms7gable	cm6tpgqwl0000s60hwj4xjow3	\N	Pin screen for Shopify POS.	{}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm8oout7h000ss60hf7p2d45b", "cm8emd06d002ks60h2409ys0r", "cmf2s9la30004s60hxnfnqget"]}	2025-11-07 19:30:31.9	2025-11-07 19:30:31.9	[]
cmg9lr4yl0001s60h92wgd567	cm7uzjhwo0001s60ht1tuhtfi	\N	still playing with the "growth dial" for agentic selling. now in code! \n\nhttps://s4m-growth-admin-playground.quick.shopify.io/growth	{}	{"😍": ["cm8ejmu4v001as60h8yyrvcc9", "cm8emt3u4002qs60hvpyias29", "cm8ejcicz000zs60hjy10f6j3", "cm8ei0oz5000hs60hf1b48fw9"]}	2025-10-02 16:01:01.149	2025-10-02 16:01:01.149	[]
cmdt859gr0001s60hkiy7duj9	cm7wbitsi000cs60hq1jnj3px	\N	Shop Week 2025 Product + OOH Creative	{}	{"😍": ["cm8egwen60008s60h4d235z20", "cm7lyry250000s60hl4e0yfts", "cm8ejkqci0017s60h1da0ulse", "cm6thw30g0008s60hkrj1wnge", "cmehagh0a0008s60hefi36534", "cm8etyse8002js60htgrx9qai", "cmet4iaps0000s60hbyycrgmn", "cm9tyb4ci0000s60hl6o3vv62", "cm8ej63t6000ss60h99hkq1b2", "cmg85whne0000s60h3nuk70o6", "cm97eexj40000s60h9oerv3n8"]}	2025-08-01 19:36:22.059	2025-08-01 19:36:22.059	[]
cmggsyy5l0001s60hym6xirns	cm8ggdz9b0000s60hm651eb4x	\N	Sign-up flow. #growth\n\n(Lots of support from Nik, Kyu, Simone)	{growth}	{"😍": ["cm8ysolaf0000s60h165ztlk4", "cm7uzjhwo0001s60ht1tuhtfi", "cm8epz4vv0044s60h0t5xt7n7", "cm8ei0oz5000hs60hf1b48fw9", "cm8ejcicz000zs60hjy10f6j3", "cm8ejlo910019s60hgjz1akqg", "cm8et181v001qs60hjqt3qupa", "cm8f3mc5w004gs60hykmeheqf", "cm6thmum10000s60hsx8v27ie", "cm84lb2sn0000s60hqn6v7ogq", "cm8hi0xco0001s60h0omgywsh", "cm8ixpljw001es60hqdbihh7p"]}	2025-10-07 16:57:26.121	2025-10-07 16:57:26.121	[]
cmgux7cyu0001s60hzohk2k7w	cm7uzjhwo0001s60ht1tuhtfi	\N	1P Funnel app that shows automations in context of their customer funnel stage: \n\nhttps://funnelappconcept.quick.shopify.io/apps/funnel	{}	{"😍": ["cmebusqtg0017s60hqz8gl2kk", "cm84lb2sn0000s60hqn6v7ogq"]}	2025-10-17 14:04:43.494	2025-10-17 14:04:43.494	[]
cmhpbi38n0007s60hytg3wrny	cm6tpgqwl0000s60hwj4xjow3	\N	Shopify Air desktop app concept. Exploring fluid transitions, minimal nav and blended Ai feature.	{}	{"😍": ["cm8gb1wkz0004s60hqv6vpj7q", "cm8emt3u4002qs60hvpyias29", "cm8emd06d002ks60h2409ys0r", "cm8oout7h000ss60hf7p2d45b", "cmesx6ypb0001s60h7oor91x8", "cm7uzjhwo0001s60ht1tuhtfi", "cmf2s9la30004s60hxnfnqget", "cm8eu7rma002ss60hly65jbvi", "cm8et973x0021s60hr0vv4y5r"]}	2025-11-07 20:38:04.007	2025-11-07 20:38:04.007	[]
cmi6668m60001s60hgo813zoh	cmg17bxfr0000s60hzi42vlms	\N	MTL - i'm at the intersection of design and engineering\n\ncreated for design eng event in montreal, nov 19 2025. used figma + affinity	{}	{"😍": ["cm8qjbu3o0000s60hs93wsv74"], "🤔": ["cmf2s9kxe0003s60hq1y96kpr", "cmf2sbwyu0006s60h7jd9ud7g", "cmapmfqcc0000s60h0z2sqlo2", "cm7lyry250000s60hl4e0yfts", "cm6thw30g0008s60hkrj1wnge", "cm8ei9oo7000ms60hkcdl4q7z"]}	2025-11-19 15:40:58.014	2025-11-19 15:40:58.014	[]
cmf4bi1d70001s60hrdntg00c	cmabnm4fs0000s60hiyjquj3k	\N	Evergreen social ad for Shop feat. motion by @erich.reimers	{}	{"😍": ["cm7lyry250000s60hl4e0yfts", "cm6thw30g0008s60hkrj1wnge", "cm7z9l7jf000bs60hg2j29tcc", "cm97eexj40000s60h9oerv3n8"]}	2025-09-03 18:35:27.211	2025-09-03 18:35:27.211	[{"userId": "cm7wbitsi000cs60hq1jnj3px", "username": "erich.reimers", "displayName": "erich.reimers"}]
cmgej2zjp0001s60hvlykl7o0	cm6thw30g0008s60hkrj1wnge	\N	Prototype from designer in residence Eli Rousso for Shop's new canvas concept	{}	{"😍": ["cm8oout7h000ss60hf7p2d45b", "cm71zq1uu0000s60hsrg9iv1g", "cm8ei0oz5000hs60hf1b48fw9", "cm8emt3u4002qs60hvpyias29", "cm7lyry250000s60hl4e0yfts", "cm8em7a7t002hs60hx8lnfgo3", "cm9aagjna0000s60hio5bk4lr", "cm8emun01002ss60hs90l6qvx"]}	2025-10-06 02:45:06.037	2025-10-06 02:45:06.037	[]
cmhpbqi9q000bs60h4hi483hh	cm6tpgqwl0000s60hwj4xjow3	\N	Minimal sidebar exploration with hover states.	{}	{"😍": ["cm8gb1wkz0004s60hqv6vpj7q", "cm8oout7h000ss60hf7p2d45b", "cmapmfqcc0000s60h0z2sqlo2", "cmesx6ypb0001s60h7oor91x8", "cm87e0fpo0000s60ha7hoh1rr", "cm9wigff80000s60hgynx5c87", "cm6zewlv30000s60hiwupvnso", "cm7uu06ge0010s60hmocr9lu5", "cm7z8n3im0003s60hurlp3xkp"]}	2025-11-07 20:44:36.734	2025-11-07 20:44:36.734	[]
cme1qs6es0001s60h8n3qh65e	cm8eoqkdb003es60hu6elqii2	\N	Multi-Shop transitions	{}	{"😍": ["cmesx6ypb0001s60h7oor91x8", "cm8en5els002xs60h8xxuak16", "cm8eo39uq0034s60h5u7p5py4", "cm7z9l7jf000bs60hg2j29tcc", "cm8epbkwd003qs60h1nfu93ph"]}	2025-08-07 18:40:13.684	2025-08-07 18:40:13.684	[]
cmi92lie70006s60hy02feujs	cm7wbitsi000cs60hq1jnj3px	\N	Shop Cart Sync paid ad 001	{}	{"😍": ["cm8eozabi003hs60hwv83es2p", "cm7lyry250000s60hl4e0yfts", "cm6zewlv30000s60hiwupvnso", "cmf2s9la30004s60hxnfnqget", "cmabnm4fs0000s60hiyjquj3k", "cm7z8n3im0003s60hurlp3xkp"]}	2025-11-21 16:24:10.591	2025-11-21 16:24:10.591	[]
cmi96me3o000ss60hxrpchl63	cmebutsfu0034s60h71p4l2gj	\N	Past design concepts for mobile/web topbar toasts	{}	{"😍": ["cmebutsfu0034s60h71p4l2gj", "cmi97em74000vs60hrecky6yy", "cm8oout7h000ss60hf7p2d45b", "cm7z93nvr0004s60hcxgjwyln"]}	2025-11-21 18:16:50.148	2025-11-21 18:16:50.148	[]
cmffg7dfl0003s60h4vkahml5	cm8ej63t6000ss60h99hkq1b2	\N	Let Shoppy take you on a guided meditation, a journey inward to awaken your entrepreneurial spirit. \nThis video was created using Midjourney (for image creation, and motion), and then the text and VO added in CapCut. 	{}	{"😍": ["cm8et181v001qs60hjqt3qupa", "cmesx6ypb0001s60h7oor91x8", "cm8elt5yz0029s60hc2wwhebn", "cm8el1bj50020s60hty74lkf9", "cm8ixpljw001es60hqdbihh7p", "cm8epbkwd003qs60h1nfu93ph"], "🤔": ["cmf2sbwyu0006s60h7jd9ud7g", "cm8f1rww4004cs60h6988nojl"]}	2025-09-11 13:32:35.649	2025-09-11 13:32:35.649	[]
cmi7skt9w0007s60hk95nw83t	cm8eozabi003hs60hwv83es2p	\N	Logo lockup for our pop-up with Seth Rogen's Houseplant @ Shopify NY. The pop-up was inspired by Seth's hand-made collection, Gloopy. Created with Chad Balanza and Jermaine Daniel.	{}	{"😍": ["cm8elhsca0023s60hh01rwo9l", "cmf2sbwyu0006s60h7jd9ud7g", "cm8eozabi003hs60hwv83es2p", "cm8et181v001qs60hjqt3qupa", "cm8em7a7t002hs60hx8lnfgo3", "cm8esf3rq000ys60hv7l3k2vy", "cm7uzjhwo0001s60ht1tuhtfi", "cmf2s9hoe0002s60hjnav3bor", "cm7lyry250000s60hl4e0yfts", "cm8egwen60008s60h4d235z20", "cmf2s9la30004s60hxnfnqget", "cm8emd06d002ks60h2409ys0r", "cm7z93nvr0004s60hcxgjwyln", "cm7w6ijj1000as60hsdoavuck", "cm8epbkwd003qs60h1nfu93ph"]}	2025-11-20 18:55:55.7	2025-11-20 18:55:55.7	[]
cmi8zm22r0001s60hx56xvxn0	cmd4nbvn20000s60h66347bvf	\N	Updated Shopify.com/shop landing page #shop	{shop}	{"😍": ["cm7lyry250000s60hl4e0yfts", "cm8oout7h000ss60hf7p2d45b", "cmf2s9hoe0002s60hjnav3bor", "cm7wbitsi000cs60hq1jnj3px", "cm6thw30g0008s60hkrj1wnge", "cm8egwen60008s60h4d235z20", "cmf2s9la30004s60hxnfnqget", "cmabnm4fs0000s60hiyjquj3k", "cm7z93nvr0004s60hcxgjwyln", "cmd4nbvn20000s60h66347bvf"]}	2025-11-21 15:00:37.25	2025-11-21 15:00:37.25	[]
cmi9dl2nu0007s60h6y14vi4b	cmabnm4fs0000s60hiyjquj3k	\N	Magic tennis racquet for Shop x Mejuri Play activation #shop	{shop}	{"😍": ["cmd4nbvn20000s60h66347bvf", "cm8oout7h000ss60hf7p2d45b", "cm8em7a7t002hs60hx8lnfgo3"]}	2025-11-21 21:31:45.979	2025-11-21 21:31:45.979	[]
cmi93rzud000os60hmjnnhuye	cm7wbitsi000cs60hq1jnj3px	\N	Shop app Q4 2025 shopping events creative - "Cozy Season" and "Setting the Table" - Made with Max Kaplun and Kaylynn Chong #shop	{shop}	{"😍": ["cm7lyry250000s60hl4e0yfts"], "🤔": ["cmf2s9hoe0002s60hjnav3bor"]}	2025-11-21 16:57:12.758	2025-11-21 16:57:12.758	[]
cmi92lzvr000bs60hw9cbvslh	cm7wbitsi000cs60hq1jnj3px	\N	Shop Cart Sync paid ad 02	{}	{"😍": ["cm8eozabi003hs60hwv83es2p", "cm7lyry250000s60hl4e0yfts", "cm8stybly0002s60hftnein0g", "cm7z93nvr0004s60hcxgjwyln"]}	2025-11-21 16:24:33.255	2025-11-21 16:24:33.255	[]
cm8f9w1xh0001s60hgn20kvqg	cm8eoqkdb003es60hu6elqii2	\N	Maintaining visual feedback when the spinner moves off screen during the loading state. #Checkout	{Checkout}	{"😍": ["cm8ek25cp001js60ht0j4wini", "cm8eo39uq0034s60h5u7p5py4", "cm7v5oid90000s60hen2v9rg2", "cm8elru8h0028s60huygpj285", "cm8erozd20005s60h3n1u3taw", "cm8gbyp6p0006s60h7u1c759x", "cm8epbkwd003qs60h1nfu93ph"], "🤔": ["cm7nx40e20005s60hqluumzai"]}	2025-03-19 01:57:53.477	2025-03-19 01:57:53.477	[]
cmi9dhlm80001s60hsmhtxfx8	cm7z93nvr0004s60hcxgjwyln	\N	Checkout redesign: Persistent order summary w/ @gladys @guillaume.granger @Jenny Walsh 	{}	{"😍": ["cm8f1rww4004cs60h6988nojl", "cm8ehcuex000bs60hyhwklqmb", "cm7z8n3im0003s60hurlp3xkp", "cm8ggdz9b0000s60hm651eb4x", "cm7w6ijj1000as60hsdoavuck", "cm8epbkwd003qs60h1nfu93ph", "cm71zq1uu0000s60hsrg9iv1g", "cm8ei0oz5000hs60hf1b48fw9"]}	2025-11-21 21:29:03.92	2025-11-21 21:29:03.92	[{"userId": "cm8eoqkdb003es60hu6elqii2", "username": "guillaume.granger", "displayName": "guillaume.granger"}]
cmhw4yndr0002s60he934ze00	cmf2s9kxe0003s60hq1y96kpr	\N	Demo of Sidekick Plans concept. A consolidated way to complete work with Sidekick.	{}	{"😍": ["cmf2sbwyu0006s60h7jd9ud7g", "cm8ei0oz5000hs60hf1b48fw9", "cm6zewlv30000s60hiwupvnso", "cm71zq1uu0000s60hsrg9iv1g", "cmf2s9la30004s60hxnfnqget", "cm7uu06ge0010s60hmocr9lu5", "cmesx6ypb0001s60h7oor91x8", "cm8ei2u30000is60hxldwf8tc", "cm8oout7h000ss60hf7p2d45b", "cm8eq5i570047s60hcb1tqbbz", "cm8x86if60007s60hsavlu472", "cm8el1bj50020s60hty74lkf9", "cm7z93nvr0004s60hcxgjwyln", "cm864b3pp0000s60huf1fmkg0", "cm8et973x0021s60hr0vv4y5r", "cmf2s9hoe0002s60hjnav3bor", "cmf2s9kxe0003s60hq1y96kpr", "cmf2s9gd70001s60hukozog5m", "cmf2s9nhf0005s60hj97ys717", "cm8esf3rq000ys60hv7l3k2vy", "cmebutsfu0034s60h71p4l2gj", "cm7w6ijj1000as60hsdoavuck"]}	2025-11-12 15:09:22.527	2025-11-12 15:09:22.527	[]
cmidos0vw0001s60h34223uol	cm8epbkwd003qs60h1nfu93ph	\N	Exploring sticky button interactions for Checkout Redesign. https://redesign-sticky-button.quick.shopify.io/ to play with the options yourself! 	{}	{"😍": ["cm8ei0oz5000hs60hf1b48fw9", "cm8epbkwd003qs60h1nfu93ph", "cm7z93nvr0004s60hcxgjwyln"]}	2025-11-24 21:56:10.748	2025-11-24 21:56:10.748	[]
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, "displayName", "photoUrl", username) FROM stdin;
cmebv1d08000hs60hmvd1p28u	ryan.ludwig@shopify.com	ryan.ludwig	https://www.gravatar.com/avatar/21e848248ddf5919b02376de47e17787	ryan.ludwig
cmebv1eu3000js60h53h6bgcw	maria.dangelo@shopify.com	maria.dangelo	https://www.gravatar.com/avatar/652f8bea55e3b7f7c2a6de7804570e90	maria.dangelo
cmebwm0z9001ls60h8ayf27d1	jeff.tarullo@shopify.com	jeff.tarullo	https://www.gravatar.com/avatar/bb656fedd0c41a6cb9674d82f1e5f239	jeff.tarullo
cmeclutv00008s60h24iircu2	adam.duncan@shopify.com	adam.duncan	https://www.gravatar.com/avatar/56dadc33066c5483e1b822c05bd23441	adam.duncan
cmecxqokr000es60h0ippnubr	reinis.babris@shopify.com	reinis.babris	https://www.gravatar.com/avatar/0af4c330ca9e72271f86313b4b5fd51b	reinis.babris
cmeh9g6xb0003s60hsymannbs	jeppe.christensen@shopify.com	jeppe.christensen	https://www.gravatar.com/avatar/b249e87a7552b69b64bccf12526a9b26	jeppe.christensen
cmeh9gj1l0004s60hp9u3u2tr	caty.gray@shopify.com	caty.gray	https://www.gravatar.com/avatar/b254319d4fe144053fc33f867f28e11e	caty.gray
cmen85q8q0000s60ha8a2cmih	nick.pinto@shopify.com	nick.pinto	https://www.gravatar.com/avatar/fa9cf0969667f84d8514381faf228c96	nick.pinto
cmfdr453k0000s60h5lef5uiz	esdras.martins@shopify.com	esdras.martins	https://www.gravatar.com/avatar/f7605eece21ff7f7b74dce6c889b9d79	esdras.martins
cmg1cknzk0001s60hz7i7w5lb	harshdeep.hura@shopify.com	harshdeep.hura	https://www.gravatar.com/avatar/6f5c7a6cabe59371c03ea975d18b60c1	harshdeep.hura
cm6zjpx940000s60h8whb0img	darrin.henein@shopify.com	darrin	https://www.gravatar.com/avatar/39db932d0b75b9822cb88db0ec508392	darrin.henein
cm6tg1zs80000s60hwx5c44p8	mark.northcott@shopify.com	Mark Northcott	https://www.gravatar.com/avatar/3afb97b0e52c6f0231dc5df5e4eb170b	mark.northcott
cm6thmum10000s60hsx8v27ie	dominic.lind@shopify.com	Dominic Lind	https://www.gravatar.com/avatar/322e26b06ac0db6fe7aa3571a07c2ba7	dominic.lind
cm6thw30g0008s60hkrj1wnge	katarina.batina@shopify.com	Katarina Batina	https://www.gravatar.com/avatar/64bd7a14d59aced5c639bce5d30bd0ba	katarina.batina
cm6tiei9k000es60hq4f5uty7	jonathan.clarkin@shopify.com	Clarkin 🚀	https://www.gravatar.com/avatar/56c60046e6edcdbded3a647699a85889	jonathan.clarkin
cm6tofeoq0000s60htca0gvcm	jason.huff@shopify.com	jason.huff	https://www.gravatar.com/avatar/dca57409b356710266a1f6b57dff9e37	jason.huff
cm6tpgqwl0000s60hwj4xjow3	andrew.braswell@shopify.com	andrew.braswell	https://www.gravatar.com/avatar/7f81f4dc329e90103a911b3f48f9c328	andrew.braswell
cm6v78gx50000s60hdg79fb2q	archie.abrams@shopify.com	archie.abrams	https://www.gravatar.com/avatar/c24c52a4a6e52058a0461b677eb2f9ce	archie.abrams
cm6zeaiap0000s60h57gwlu37	jason.gouliard@shopify.com	jason.gouliard	https://www.gravatar.com/avatar/f793350928ae8eb924bb22dc20078ca2	jason.gouliard
cm6zewlv30000s60hiwupvnso	roy.stanfield@shopify.com	roy.stanfield	https://www.gravatar.com/avatar/f208464372363aee50ba238b25f44477	roy.stanfield
cm6zo4gzv0000s60hv96hpnc8	max.dasilva@shopify.com	Max Da Silva	https://www.gravatar.com/avatar/69d4c2ca6378ee442e3b52d520ddb1e5	max.dasilva
cm70xilxf0000s60h4trjn0fn	raphael.lomotey@shopify.com	raphael.lomotey	https://www.gravatar.com/avatar/f165f4fe44d463e190b9cda5ccaac44c	raphael.lomotey
cm7dkdzma0000s60htiiz8w22	kiara.stewart@shopify.com	kiara.stewart	https://www.gravatar.com/avatar/89e7ffcf3866937c73573bd25dab0d6c	kiara.stewart
cm7dknccc0001s60h91uu7t00	kevin.odonnell@shopify.com	kevin.odonnell	https://www.gravatar.com/avatar/8bbed9ec15f1a8f0ce6ae20832de438b	kevin.odonnell
cm7f9ablt0000s60hkicvhfr6	tadhg.boyle@shopify.com	tadhg	https://www.gravatar.com/avatar/31ecd46515da8d9ef5d14ec5efcce9a3	tadhg.boyle
cm7jke4p00003s60hauy0agm1	jess.erickson@shopify.com	jess.erickson	https://www.gravatar.com/avatar/12f294d1f033054380562b3b8534da5b	jess.erickson
cm7lrgblr0000s60h3klcjepu	jake.archibald@shopify.com	jake.archibald	https://www.gravatar.com/avatar/e410f65384bd827a3b0ca3fa15e561d6	jake.archibald
cm7lyry250000s60hl4e0yfts	eurie.kim@shopify.com	eurie.kim	https://www.gravatar.com/avatar/9e6ca668fb0b0301c9d9b439818bbbc7	eurie.kim
cm71zq1uu0000s60hsrg9iv1g	jon.rundle@shopify.com	Jon Rundle	https://www.gravatar.com/avatar/54729171dbc730d793ac4a6c8ab4ce59	jon.rundle
cm7nm6s9j0000s60hxxf8hx4i	david.stubbs@shopify.com	david.stubbs	https://www.gravatar.com/avatar/31e07ed6e362e20832be36625a77ae3a	david.stubbs
cm7nx40e20005s60hqluumzai	sebastian.speier@shopify.com	sebastian.speier	https://www.gravatar.com/avatar/f50e2266c0840663930dc3cd55206e60	sebastian.speier
cm7ny5spo0000s60hqabmc2ws	derek.chan@shopify.com	Derek Chan	https://www.gravatar.com/avatar/7d77ed566fed4f2162457266637e9b8a	derek.chan
cm7okm0yo0000s60h4d4txvi3	ryan.cordell@shopify.com	ryan.cordell	https://www.gravatar.com/avatar/2be9ab5aa8b094fa6caf0d064bdf9ec8	ryan.cordell
cm7oyhrpy0001s60hawvkm8f1	raquel.vilariofernandez@shopify.com	raquel.vilariofernandez	https://www.gravatar.com/avatar/38097fde195e58bb036be70de2fefaca	raquel.vilariofernandez
cm7oyhrpz0002s60hluhwg5bj	kristen.leach@shopify.com	kristen.leach	https://www.gravatar.com/avatar/15d082742c9c611fe103f38a5c46ba5b	kristen.leach
cm7oyhrpy0000s60hp7oifrws	avi.ashkenazi@shopify.com	avi.ashkenazi	https://www.gravatar.com/avatar/f20f0169ccbb7a418fb5f720634c4ad9	avi.ashkenazi
cm7tix8ie0003s60hoy2kzd85	breanna.pilon@shopify.com	breanna.pilon	https://www.gravatar.com/avatar/a611d73c10d5b010b84ebdaa4979f77d	breanna.pilon
cm7thki660000s60hlrru9mhx	connell.mccarthy@shopify.com	Connell	https://www.gravatar.com/avatar/781ec63fbadeadb1f4a9ab063070f7fc	connell.mccarthy
cm7tp7xd4000gs60h1hu9598i	james.findlater@shopify.com	james.findlater	https://www.gravatar.com/avatar/45044ec68f2c6e12c2b93722cd6485f7	james.findlater
cm7uxtn5k000fs60hyfb7xws8	jeffrey.loppert@shopify.com	jeffrey.loppert	https://www.gravatar.com/avatar/3c02427046a60e5f481bee234da6e2dd	jeffrey.loppert
cm7uyxpiz0013s60hceras7ah	josh.meyer@shopify.com	josh.meyer	https://www.gravatar.com/avatar/bc541402e9bf0d4422f7c1ce01879065	josh.meyer
cm7uz8qc20000s60had0ae7rt	lucas.marcotterichardson@shopify.com	lucas.marcotterichardson	https://www.gravatar.com/avatar/fdafe122ce37216ac89c28f6feb51c77	lucas.marcotterichardson
cm7uzjhwo0001s60ht1tuhtfi	kazden.cattapan@shopify.com	kazden.cattapan	https://www.gravatar.com/avatar/4d334c73efffe20da04c8d8d9e6e11b2	kazden.cattapan
cm7v30c2f0000s60h6z1za6xh	harry.copeman@shopify.com	harry.copeman	https://www.gravatar.com/avatar/c9d02ff7f2bcc78a6ed81a96ee715f2b	harry.copeman
cm7v5oid90000s60hen2v9rg2	andrea.mangini@shopify.com	andrea.mangini	https://www.gravatar.com/avatar/9a0cd9774d7f66a78c5433273e5986eb	andrea.mangini
cm7w5b1un0007s60hy1nce386	kenny.cohen@shopify.com	kenny.cohen	https://www.gravatar.com/avatar/d2d48d2740d6534c070bf712f680c749	kenny.cohen
cm7w6ijj1000as60hsdoavuck	matt.cane@shopify.com	matt.cane	https://www.gravatar.com/avatar/bd5d5ff1aa41cb52e4481ab7e60eb67e	matt.cane
cm7w6pvky000bs60hmb38qjbd	annetta.sillard@shopify.com	annetta.sillard	https://www.gravatar.com/avatar/44b6eab12c3db1cb14a7018588b351e2	annetta.sillard
cm7w8g3650000s60h5rzvmqcw	katrina.bautista@shopify.com	katrina.bautista	https://www.gravatar.com/avatar/4a391ee18c2900baec649e8003d922fb	katrina.bautista
cm7w8lz2d0001s60h7m7vk072	veronica.wong@shopify.com	veronica.wong	https://www.gravatar.com/avatar/1d23ff2845ad63217e9bcb4145a4de14	veronica.wong
cmebx22gk001ms60h8gwrudf2	tanya.nam@shopify.com	tanya.nam	https://www.gravatar.com/avatar/1086d58571f69de32ff7331b6393cff4	tanya.nam
cm7waaezb0005s60hjxfkpznf	chris.johnston@shopify.com	chris.johnston	https://www.gravatar.com/avatar/cb50d8310d722f2fab4cd35557c00a65	chris.johnston
cm7wayd3g000bs60htgdbt3mm	annie.jacobson@shopify.com	annie.jacobson	https://www.gravatar.com/avatar/48035400355687462b0681e5f6c43d11	annie.jacobson
cm7wbitsi000cs60hq1jnj3px	erich.reimers@shopify.com	erich.reimers	https://www.gravatar.com/avatar/30b14fd27a07625970d066d9e4f9d163	erich.reimers
cm7whzxin000fs60hky65yi4a	matt.griffin@shopify.com	matt.griffin	https://www.gravatar.com/avatar/8c73034c5aff98f8373683c6a0d18bd5	matt.griffin
cm7xvkve80003s60hi7nmelq4	travis.smith@shopify.com	travis.smith	https://www.gravatar.com/avatar/2c02bca5094a600242fe0dde4ff92574	travis.smith
cm7yuae8o0000s60h7uwj418z	adam.butterworth@shopify.com	adam.butterworth	https://www.gravatar.com/avatar/5a53017eef004a89ddbfca6959cfbc73	adam.butterworth
cm7yx5dc50000s60hlu2jxmg4	ashley.legiadre@shopify.com	ashley.legiadre	https://www.gravatar.com/avatar/98a6dc48a09470619d1ce08872ce4de1	ashley.legiadre
cm7z8n3im0003s60hurlp3xkp	nick.lenko@shopify.com	nick.lenko	https://www.gravatar.com/avatar/64150deee7655eecb946aa948a55c5ef	nick.lenko
cm7z9jt6f000as60ha21r1psy	liz.khoo@shopify.com	liz.khoo	https://www.gravatar.com/avatar/a2bb754e7c5daba6547057d65d7fb062	liz.khoo
cm7z9lkyy000cs60h9jintrt8	mariephilipe.boucher@shopify.com	mariephilipe.boucher	https://www.gravatar.com/avatar/2f6a9f77ea8e634ffabd4bd29002750b	mariephilipe.boucher
cm7za6450000js60h1p0i3k3s	ashley.allen@shopify.com	ashley.allen	https://www.gravatar.com/avatar/ef69ef1af21baecf083c26aa80bf809a	ashley.allen
cm7zc3ylp0000s60hpc7gtlbl	raschin.fatemi@shopify.com	raschin.fatemi	https://www.gravatar.com/avatar/aa6092d9ffd49a0a2edc30ce24a57e7c	raschin.fatemi
cm7z9l7jf000bs60hg2j29tcc	fabien.laborie@shopify.com	Fabien Laborie	https://www.gravatar.com/avatar/f5103476d49fb055316fe066ebf37b57	fabien.laborie
cm838bihr0003s60ho64izcoq	amy.shea@shopify.com	amy.shea	https://www.gravatar.com/avatar/8da21d8c0a921852648d5c53b32ce478	amy.shea
cm838k8c90004s60hgmf319ly	adam.perron@shopify.com	adam.perron	https://www.gravatar.com/avatar/0132c52ac71e9b6a698871de3dd690d5	adam.perron
cm838q6yr0005s60h6pqp049n	levon.cross@shopify.com	levon.cross	https://www.gravatar.com/avatar/7c8c819adcd658725044a4dcffd5fbe3	levon.cross
cm83aatnm0000s60h9m885znd	pablo.boerr@shopify.com	pablo.boerr	https://www.gravatar.com/avatar/20b6f0d8bf75a873470327f2b05a9970	pablo.boerr
cm7xlifn90000s60hihjg8d5q	kyle.howard@shopify.com	Kyle Howard	https://www.gravatar.com/avatar/644cf64bb03b70b614dfce6a6fe03a38	kyle.howard
cm7wibdne000ps60hzeyyelxl	jeewon.choi@shopify.com	jeewon.choi	https://www.gravatar.com/avatar/6ddaac0ea17132fcb7b255b264dedf38	jeewon.choi
cm7uu06ge0010s60hmocr9lu5	luke.dupont@shopify.com	Luke Dupont	https://www.gravatar.com/avatar/5939d4392a135525d5e2668596e2cf5a	luke.dupont
cm83d5ej90000s60hw8zqppja	cassia.brooks@shopify.com	cassia.brooks	https://www.gravatar.com/avatar/f76e432d8d7bbc1c69ce7ce79d6d1602	cassia.brooks
cm83u3z1z0000s60hvbzqic4w	rachel.ng@shopify.com	rachel.ng	https://www.gravatar.com/avatar/997464fc8274cbc422e77ca39f71badc	rachel.ng
cm864b3pp0000s60huf1fmkg0	jordan.ouellette@shopify.com	jordan.ouellette	https://www.gravatar.com/avatar/0c8510fd54146594794e147ea532ff46	jordan.ouellette
cm86e3kyx0000s60hw5t5scjq	stephanie.agnino@shopify.com	stephanie.agnino	https://www.gravatar.com/avatar/fc4bc9c0e24c6b77ee4c7343672bf2df	stephanie.agnino
cm87e0fpo0000s60ha7hoh1rr	staci.kelly@shopify.com	staci.kelly	https://www.gravatar.com/avatar/979918139ec124c5c99ba38580307e72	staci.kelly
cm88v8mmu0000s60hlcwofw53	kevin.stone@shopify.com	kevin.stone	https://www.gravatar.com/avatar/01a5991335d843503c259550fd60036f	kevin.stone
cm7w8mea50002s60h0gesz0yx	polly.auyeung@shopify.com	Polly Auyeung	https://www.gravatar.com/avatar/750a31042bde8a218c67ad28f613fa1c	polly.auyeung
cm8egfasb0000s60h8emeqkln	philippe.jean@shopify.com	philippe.jean	https://www.gravatar.com/avatar/96ed4e0370bbdbb622c30d11836d05c2	philippe.jean
cm8egfitt0001s60hr9zydwp1	matt.zarandi@shopify.com	matt.zarandi	https://www.gravatar.com/avatar/5f9a717154be9a1286610e93b11e83a8	matt.zarandi
cm8eggc7v0002s60h5i2iv60r	celso.white@shopify.com	celso.white	https://www.gravatar.com/avatar/3d957b63511e76e80996371496de4ef5	celso.white
cm8eglgqg0003s60h68nle7ph	jiri.crispeyn@shopify.com	jiri.crispeyn	https://www.gravatar.com/avatar/49c1e302c3ed7e338f65eb2cdc4a80f4	jiri.crispeyn
cm8egmu9h0004s60hp5m8so6a	vlad.tutunea@shopify.com	vlad.tutunea	https://www.gravatar.com/avatar/6fd548340dec2af529668782dbabfa7e	vlad.tutunea
cm8egqh350005s60h6cgdcow5	swati.swoboda@shopify.com	swati.swoboda	https://www.gravatar.com/avatar/f95a5ba2ea7861add342a286f73bff95	swati.swoboda
cm8egsoeb0006s60hxag3eokn	lilla.bardenova@shopify.com	lilla.bardenova	https://www.gravatar.com/avatar/8fc1570c3bb651d542627a69938b7afa	lilla.bardenova
cm8egwa490007s60hisqfwk9t	dustin.malik@shopify.com	dustin.malik	https://www.gravatar.com/avatar/77b5952d8f65a85a294105dc756817b0	dustin.malik
cm8egwen60008s60h4d235z20	max.kaplun@shopify.com	max.kaplun	https://www.gravatar.com/avatar/9ee690a2f722877ae641ba3918eeae2e	max.kaplun
cm8eh1xug0009s60h0l7su65v	meg.smith@shopify.com	meg.smith	https://www.gravatar.com/avatar/279a7f62f42a2793567525e685bee5ed	meg.smith
cm8eh29q5000as60hj26iopcc	chris.blinstrub@shopify.com	chris.blinstrub	https://www.gravatar.com/avatar/70834f8d0929692aae105276a6de63e7	chris.blinstrub
cm8ehcuex000bs60hyhwklqmb	laura.forbes@shopify.com	laura.forbes	https://www.gravatar.com/avatar/bf26a695508368d68a68815d8737378c	laura.forbes
cm8ehf1b0000cs60hd4ja2348	patrick.banta@shopify.com	patrick.banta	https://www.gravatar.com/avatar/53a318b53458389b78462392ad860110	patrick.banta
cm8ehkmog000ds60hzu5pshdp	annabel.lake@shopify.com	annabel.lake	https://www.gravatar.com/avatar/c79de92c26714e9c78ee4c36c09f4735	annabel.lake
cm8ehkmph000es60huounfsyr	kayleigh.eales@shopify.com	kayleigh.eales	https://www.gravatar.com/avatar/91de3f4896ac611bc693775d30640740	kayleigh.eales
cm8ehms5q000fs60huvpbq36w	jen.stanicak@shopify.com	jen.stanicak	https://www.gravatar.com/avatar/5f7d3393f040b1444b19a03f6ec27e51	jen.stanicak
cm8ehy4x1000gs60h8219dozk	trevor.silvani@shopify.com	trevor.silvani	https://www.gravatar.com/avatar/d97d21719b68257168eec3003177797d	trevor.silvani
cm8ei0oz5000hs60hf1b48fw9	jonathan.minori@shopify.com	Jonathan Minori	https://www.gravatar.com/avatar/a339f95bcb2adb25768dbabb640058bb	jonathan.minori
cm8ei3whj000js60h7068vsji	ryna.gallardo@shopify.com	ryna.gallardo	https://www.gravatar.com/avatar/3e0864fd3fb18d83568a2d3d7a0bebe8	ryna.gallardo
cm8ei5lva000ks60hziburdnr	matthew.herlihey@shopify.com	matthew.herlihey	https://www.gravatar.com/avatar/bb82512f02bd32d84f35f79503b970bf	matthew.herlihey
cm8ei746d000ls60h46kvt8ql	demi.peppas@shopify.com	demi.peppas	https://www.gravatar.com/avatar/ee6f296648889501d159885b3b24c89b	demi.peppas
cm8ei9oo7000ms60hkcdl4q7z	arthur.cloche@shopify.com	arthur.cloche	https://www.gravatar.com/avatar/d4557ec20c8e735791b80044ff07980d	arthur.cloche
cm8eif74r000ns60h7q24vin3	hilary.graham@shopify.com	hilary.graham	https://www.gravatar.com/avatar/8e22d06ad413d23263fdf95991e5a192	hilary.graham
cm8eij1gl000os60hhtkl2186	kaitlyn.horch@shopify.com	kaitlyn.horch	https://www.gravatar.com/avatar/843bf92930a907e9eeb65b0d2c02d9e6	kaitlyn.horch
cm8eiqao1000ps60h6gdadcva	michael.hellicar@shopify.com	michael.hellicar	https://www.gravatar.com/avatar/a3bc67b5c0e7e7955a79454b133c1626	michael.hellicar
cm8ej07g2000qs60h0k9wmxnb	chelsea.leathley@shopify.com	chelsea.leathley	https://www.gravatar.com/avatar/96a5d27b71eab49b51a6f3202386ea69	chelsea.leathley
cm8ej4knm000rs60hcjl32a85	evan.brock@shopify.com	evan.brock	https://www.gravatar.com/avatar/6f33562043a0fff0a0610702598c21ae	evan.brock
cm8ej63t6000ss60h99hkq1b2	emma.corby@shopify.com	emma.corby	https://www.gravatar.com/avatar/b4219b1b8147bd713c79e7ec3e95db8b	emma.corby
cm8ej8d93000ts60h1e14plz5	jon.lopkin@shopify.com	jon.lopkin	https://www.gravatar.com/avatar/d82a205836f580a5783e66677b865b0e	jon.lopkin
cm8ej9zni000xs60h90y0zq9y	gabriel.morillo@shopify.com	gabriel.morillo	https://www.gravatar.com/avatar/9b0dcb3cda27f6b0b848c2d181b2fe4f	gabriel.morillo
cm8ejbj6l000ys60h8f353fxd	arnel.hasanovic@shopify.com	arnel.hasanovic	https://www.gravatar.com/avatar/4c9cf8660cec4dd58b0cb6b901825efb	arnel.hasanovic
cm8ejcicz000zs60hjy10f6j3	florina.visinescu@shopify.com	florina.visinescu	https://www.gravatar.com/avatar/1d1d137aa5887610b244f8cf25f2558d	florina.visinescu
cm8ejcxc20010s60htnn7a3q6	ayana.siddiqui@shopify.com	ayana.siddiqui	https://www.gravatar.com/avatar/71f0efb05072cd5de6005242684e3e98	ayana.siddiqui
cm8ejgprk0011s60hb2n69yfm	michael.rembach@shopify.com	michael.rembach	https://www.gravatar.com/avatar/5e939b23a045bbc3f9aa9b423ea451ed	michael.rembach
cm8ejkc6h0015s60hpilouny1	stephanie.joo@shopify.com	stephanie.joo	https://www.gravatar.com/avatar/045f4c8c0e7099cf78b0fd9f2ddd7037	stephanie.joo
cm8ejkncb0016s60hegr5c8xa	sarahn.fischer@shopify.com	sarahn.fischer	https://www.gravatar.com/avatar/6db2cacea538d39aa02838f9b62719b0	sarahn.fischer
cm8ejkqci0017s60h1da0ulse	ronald.rabideau@shopify.com	ronald.rabideau	https://www.gravatar.com/avatar/2d56e3cf670baa180de3767ff8386ed7	ronald.rabideau
cm84lb2sn0000s60hqn6v7ogq	rachel.mcclung@shopify.com	Rachel McClung	https://www.gravatar.com/avatar/08b36925fcde30395b0b90cd8273d34f	rachel.mcclung
cm8ejkt910018s60httxfcf76	shannon.murphy@shopify.com	shannon.murphy	https://www.gravatar.com/avatar/3e7b1ef4f43832735ec948880dc7fa54	shannon.murphy
cmebv1dyj000is60hs2axs6dr	alex.boothe@shopify.com	alex.boothe	https://www.gravatar.com/avatar/36277948a379d7d6f793193b749e6528	alex.boothe
cmebxbxlg001ns60hd31w7b7m	artyom.astafurov@shopify.com	artyom.astafurov	https://www.gravatar.com/avatar/ead4c685df421fc72033815152f1f31c	artyom.astafurov
cmecm1gp90009s60hb3qy9mde	shuang.shan@shopify.com	shuang.shan	https://www.gravatar.com/avatar/f6d98cd8d201adac4494b04ade7126ff	shuang.shan
cmecy8t4a000fs60hxyfa5lm2	saara.hafeez@shopify.com	saara.hafeez	https://www.gravatar.com/avatar/3c0d3557e9ea67acc4400c3ccc936fa1	saara.hafeez
cmeh9mrxn0005s60hj9u3ansx	gurmeet.singh@shopify.com	gurmeet.singh	https://www.gravatar.com/avatar/f15188f2504e649ae4bee70d6dd2df0b	gurmeet.singh
cmerdnqfx0000s60h18ne9eq7	jonna.brehmer@shopify.com	jonna.brehmer	https://www.gravatar.com/avatar/a1a1cd93570c4ad0fcb56f2c609839b9	jonna.brehmer
cmfe0rxue0000s60hu8ki55pu	waqas.ahmed@shopify.com	waqas.ahmed	https://www.gravatar.com/avatar/d69f24a5135d0dc957024783d8cb988b	waqas.ahmed
cmg1fl5wt0000s60h31e79b1y	pouya.mozaffarmagham@shopify.com	pouya.mozaffarmagham	https://www.gravatar.com/avatar/7edd9dfcf2d32a2d142534f9c56913e4	pouya.mozaffarmagham
cm8ejlo910019s60hgjz1akqg	joy.panjaitan@shopify.com	joy.panjaitan	https://www.gravatar.com/avatar/df58c246fc5a0c01d3d311f219940f90	joy.panjaitan
cm8ejmu4v001as60h8yyrvcc9	kristina.pyton@shopify.com	kristina.pyton	https://www.gravatar.com/avatar/d35d7913e4ddd736482a1ae4943cbb78	kristina.pyton
cm8ejsw8r001bs60hkkvtnfaw	kevin.sharon@shopify.com	kevin.sharon	https://www.gravatar.com/avatar/77e6995f7ef44ad74c6c3a8775c8f5e4	kevin.sharon
cm8ejvc2n001cs60hc2rywr0f	debbie.chan@shopify.com	debbie.chan	https://www.gravatar.com/avatar/20f4aa03e5b33a00430434dc1056a089	debbie.chan
cm8ejx2oq001ds60hxfkse73w	scott.mcneill@shopify.com	scott.mcneill	https://www.gravatar.com/avatar/445756edb9888d23e74ac232abcca406	scott.mcneill
cm8ejxgyi001es60hf3449go3	phil.mcclelland@shopify.com	phil.mcclelland	https://www.gravatar.com/avatar/cf1717aec6199818dd0c8e7edb571a09	phil.mcclelland
cm8ejzd65001fs60huave5rch	chris.muratis@shopify.com	chris.muratis	https://www.gravatar.com/avatar/0d45bacd4bce1416ae5d4679d5ab0e51	chris.muratis
cm8ejzoes001gs60h2hnkz55p	therese.owusu@shopify.com	therese.owusu	https://www.gravatar.com/avatar/46ad8d03d342337d17a6ad7c08d3d21e	therese.owusu
cm8ek16ru001hs60hbior11iu	jenn.piatkowski@shopify.com	jenn.piatkowski	https://www.gravatar.com/avatar/a8014c73bf54b2d06574ad4d3cdd000c	jenn.piatkowski
cm8ek1j1q001is60ht0i9p7tf	james.trever@shopify.com	james.trever	https://www.gravatar.com/avatar/87fb57d116b895d70c0c2550eccc6864	james.trever
cm8ek25cp001js60ht0j4wini	joao.carlosquintino@shopify.com	joao.carlosquintino	https://www.gravatar.com/avatar/6540b2922483e6005d96340acaf4765c	joao.carlosquintino
cm8ek2sxz001ks60h47w9phkl	caroline.gonzales@shopify.com	caroline.gonzales	https://www.gravatar.com/avatar/199230b5b488b1cd13641bd6d7bf660b	caroline.gonzales
cm8ek7dn6001ls60huton5bx9	lucas.santo@shopify.com	lucas.santo	https://www.gravatar.com/avatar/8f12b9515ad0fd0781d43625ceb418d4	lucas.santo
cm8ekcp8f001ms60hv6zkh8lq	mckayla.lankau@shopify.com	mckayla.lankau	https://www.gravatar.com/avatar/7fa0b988a603d3ebc09433723d5be61f	mckayla.lankau
cm8ekdhfk001ns60hm1dv1iza	matt.lee@shopify.com	matt.lee	https://www.gravatar.com/avatar/4585ea3c9ba23ed7bcbf3da84fee06e0	matt.lee
cm8ekjy21001os60hsk8ue62t	elizabeth.meyer@shopify.com	elizabeth.meyer	https://www.gravatar.com/avatar/5342bc2d9792dac5866e034734a8358c	elizabeth.meyer
cm8ekkpgy001ps60h0dnn6jdq	leslie.xin@shopify.com	leslie.xin	https://www.gravatar.com/avatar/f14c17a7655007a093d04711b5c3792a	leslie.xin
cm8eklygv001qs60hacwg5lbe	ali.angco@shopify.com	ali.angco	https://www.gravatar.com/avatar/4979877cf3a752ff7800a69ed7a74cf9	ali.angco
cm8eklzmu001rs60hme7feqc3	mike.gaynor@shopify.com	mike.gaynor	https://www.gravatar.com/avatar/4253eb89ad4f3b73229ff7623e321e97	mike.gaynor
cm8eknbru001ss60hofpnih28	edna.delgado@shopify.com	edna.delgado	https://www.gravatar.com/avatar/2e76bc18a45c1d6e05f5eff4ac7e549a	edna.delgado
cm8ekpvmz001ts60hex88z0pm	joe.thomas@shopify.com	joe.thomas	https://www.gravatar.com/avatar/fa0bdcbbb848aa51b501c6ac85f3b2bb	joe.thomas
cm8ekrpnq001us60h6jqwx8o3	faith.davis@shopify.com	faith.davis	https://www.gravatar.com/avatar/e85cf6bbc3f0cbec5680d5afe7f2ee7a	faith.davis
cm8eksrtv001vs60hdu72vvpb	torben.nielsen@shopify.com	torben.nielsen	https://www.gravatar.com/avatar/d01752547ddf2f0aef9d33c9cf943f0d	torben.nielsen
cm8ektrk0001zs60hw33zeekm	xuya.wang@shopify.com	xuya.wang	https://www.gravatar.com/avatar/e992e3ee4fda19c6114db10380b9716a	xuya.wang
cm8el1bj50020s60hty74lkf9	maggie.fost@shopify.com	maggie.fost	https://www.gravatar.com/avatar/f37de2259cd727e90661c7ad7c8457d9	maggie.fost
cm8elaumx0021s60htieuy9tu	kate.oreilly@shopify.com	kate.oreilly	https://www.gravatar.com/avatar/611ef3ba04b5754daefc42278d348d17	kate.oreilly
cm8elg2lu0022s60hgrc845md	clinton.forry@shopify.com	clinton.forry	https://www.gravatar.com/avatar/e6fc3609c97bbb9136beb750e3013e06	clinton.forry
cm8elhsca0023s60hh01rwo9l	chad.balanza@shopify.com	chad.balanza	https://www.gravatar.com/avatar/4e958aebfcc72f493fbdf4c28a7e12ab	chad.balanza
cm8elij4a0024s60h7w4t0tzf	devin.asaro@shopify.com	devin.asaro	https://www.gravatar.com/avatar/e3c8e13885350eb9318ee3c142be0aa7	devin.asaro
cm8elj1m00025s60hh2va0aga	ellen.tham@shopify.com	ellen.tham	https://www.gravatar.com/avatar/e2712d1e799c305ec059316ebd44b7cc	ellen.tham
cm8ellt0w0026s60hg85woimb	sadia.latifi@shopify.com	sadia.latifi	https://www.gravatar.com/avatar/fd683d41a5e0d1271e45169d315646fc	sadia.latifi
cm8elownj0027s60hawsv3dwc	joey.lacus@shopify.com	joey.lacus	https://www.gravatar.com/avatar/3b13af54cf8825ce186514ca707585d7	joey.lacus
cm8elru8h0028s60huygpj285	jesse.haff@shopify.com	jesse.haff	https://www.gravatar.com/avatar/051639f8c6ae5cdd5a2b743247e1cf53	jesse.haff
cm8elt5yz0029s60hc2wwhebn	jes.frigon@shopify.com	jes.frigon	https://www.gravatar.com/avatar/8d1b14080821804d20dd93f18f3ffa23	jes.frigon
cm8elw5do002as60hc5kk3jk9	graham.scott@shopify.com	graham.scott	https://www.gravatar.com/avatar/0eb1440d5a94f1b70f41a4cfdc5fdbc2	graham.scott
cm8elwpq9002bs60hedm3l2yj	craig.betts@shopify.com	craig.betts	https://www.gravatar.com/avatar/3cd6a0f928e95431c8f9fe3f6ab29604	craig.betts
cmebv1fdj000ks60hkhspz9zc	james.meng@shopify.com	james.meng	https://www.gravatar.com/avatar/8f36ae0f53eec102e7d78a95033d58a5	james.meng
cm8em6fze002gs60hysgusq6m	austin.kirk@shopify.com	austin.kirk	https://www.gravatar.com/avatar/9cfd6f75785268bbb6397dc87498669f	austin.kirk
cm8em7a7t002hs60hx8lnfgo3	matt.hryhorsky@shopify.com	matt.hryhorsky	https://www.gravatar.com/avatar/76cda34277914d1d8774bae5f62c2769	matt.hryhorsky
cm8em8wcq002is60h8xdhfsqr	shaun.mcquaker@shopify.com	shaun.mcquaker	https://www.gravatar.com/avatar/ee7dd60dec9f23ec17d73de0f0f521bd	shaun.mcquaker
cm8emb8ht002js60hq9fqygaq	kevin.clark@shopify.com	kevin.clark	https://www.gravatar.com/avatar/0283b999d038ddf7b95822c7af7f4e7c	kevin.clark
cm8emd06d002ks60h2409ys0r	daina.lightfoot@shopify.com	daina.lightfoot	https://www.gravatar.com/avatar/9a6cf2a478071717aac0ad24e49b8a59	daina.lightfoot
cm8emicsc002ls60hhqiamahp	akshar.barot@shopify.com	akshar.barot	https://www.gravatar.com/avatar/579ab46df97c7d9fff30ff2a24165eba	akshar.barot
cm8emivt1002ms60hrx1o9385	virginia.start@shopify.com	virginia.start	https://www.gravatar.com/avatar/61a3d9484710b922c9a8a2be87cc6e9b	virginia.start
cm8emjunf002ns60hs1ufahhv	mike.bulajewski@shopify.com	mike.bulajewski	https://www.gravatar.com/avatar/786db7673b67a5fd2e5e791293bcd5aa	mike.bulajewski
cm8emmes1002os60hfgdnrd49	rafael.flora@shopify.com	rafael.flora	https://www.gravatar.com/avatar/77e2e0a6c51d87ef027e41fcb76d8264	rafael.flora
cm8eqfigl0000s60h6t0ptv7l	leen.tan@shopify.com	leen.tan	https://www.gravatar.com/avatar/93355b9c8cd9c5efcf28cc8eaa3f4bc3	leen.tan
cm8empxpm002ps60hwnc2iw1z	stephanie.chan@shopify.com	stephanie.chan	https://www.gravatar.com/avatar/c3247c6a110c497afe30b3f1292a5d0b	stephanie.chan
cm8emt3u4002qs60hvpyias29	jacques.krzepkowski@shopify.com	jacques.krzepkowski	https://www.gravatar.com/avatar/8c5be4882896de671e095fa3c5c92173	jacques.krzepkowski
cm8emu9km002rs60hmsefnbkc	ethan.sztuhar@shopify.com	ethan.sztuhar	https://www.gravatar.com/avatar/411aab41c5ae4a2054844cb7647e135e	ethan.sztuhar
cm8emun01002ss60hs90l6qvx	salma.amzil@shopify.com	salma.amzil	https://www.gravatar.com/avatar/e228113c720d4a0c3a15609717c86c4b	salma.amzil
cm8en3qp3002ts60h6jmgqivy	caroline.oneil@shopify.com	caroline.oneil	https://www.gravatar.com/avatar/de01ddc33a6329a36276e0d1cfb1edda	caroline.oneil
cm8en4h3l002us60hxumpqd1o	maxence.parenteau@shopify.com	maxence.parenteau	https://www.gravatar.com/avatar/485abbfcb1c708ee5a42dee1a15df73d	maxence.parenteau
cm8en4hyg002vs60hx2hpkngb	rochelle.shen@shopify.com	rochelle.shen	https://www.gravatar.com/avatar/f56498cfddcd60f5ac3939ed94b4a5c5	rochelle.shen
cm8en5db7002ws60hbj8h20c5	sara.hill@shopify.com	sara.hill	https://www.gravatar.com/avatar/dbfbd6c4bdfe831b0d2e9f2c1f66a021	sara.hill
cm8en5els002xs60h8xxuak16	christine.zoltok@shopify.com	christine.zoltok	https://www.gravatar.com/avatar/5d98b337620b07ebcd62d7820f82e32c	christine.zoltok
cm8enl3at002ys60hq4il1t1b	nicole.lee@shopify.com	nicole.lee	https://www.gravatar.com/avatar/c491027d036d8348ac7791823b4c1b66	nicole.lee
cm8enr5j6002zs60hl44lf643	roberta.takaki@shopify.com	roberta.takaki	https://www.gravatar.com/avatar/bdf72958af909efa834830543692beba	roberta.takaki
cm8eo1etv0030s60hwtdzr22r	jose.silva@shopify.com	jose.silva	https://www.gravatar.com/avatar/6e981db3fdfc8fb9eafc6b46eba4ece2	jose.silva
cm8eo1p0x0031s60hafze9b31	rachel.tiscione@shopify.com	rachel.tiscione	https://www.gravatar.com/avatar/42e71b814bf4b9aeb0284e7ac47ef50e	rachel.tiscione
cm8eo39uq0034s60h5u7p5py4	gladys.ng@shopify.com	gladys.ng	https://www.gravatar.com/avatar/61755f21fad2e8369fcdd7508045cb05	gladys.ng
cm8eo3bce0035s60hxpwg22wt	misha.damjanic@shopify.com	misha.damjanic	https://www.gravatar.com/avatar/6e4aedc1fbbaed2fd08e7d70d0af3aff	misha.damjanic
cm8eo58zt0036s60ht4c3mf3x	mariana.leyton@shopify.com	mariana.leyton	https://www.gravatar.com/avatar/4b0429c39eafa67c260db57c3ea43565	mariana.leyton
cm8eo76b20037s60hqz9kwsj1	deanna.horton@shopify.com	deanna.horton	https://www.gravatar.com/avatar/113593e2703de3defa481395663e082c	deanna.horton
cm8eo7ayx0038s60hl2jhsxw6	natalie.hopson@shopify.com	natalie.hopson	https://www.gravatar.com/avatar/63599b14a6e5f6eff180eb61e1d88e37	natalie.hopson
cm8eo86ln0039s60hifbofb7z	elizabeth.pirrone@shopify.com	elizabeth.pirrone	https://www.gravatar.com/avatar/109f3cdd5e8cf5f0f0f940a67ea43c59	elizabeth.pirrone
cm8eogpi5003cs60h4bjhqqva	jayson.tan@shopify.com	jayson.tan	https://www.gravatar.com/avatar/c1d59e7bd0c86bf508e961df4cafe16e	jayson.tan
cm8eohfdr003ds60hh7qsnfot	jordan.stead@shopify.com	jordan.stead	https://www.gravatar.com/avatar/a3b7cc85487924c417415e8c5d908f20	jordan.stead
cm8eoqkdb003es60hu6elqii2	guillaume.granger@shopify.com	guillaume.granger	https://www.gravatar.com/avatar/f2a0f75227b7e1b96344d32a22562f5c	guillaume.granger
cm8eot5kt003fs60hftpy76n2	willow.cheng@shopify.com	willow.cheng	https://www.gravatar.com/avatar/75e18d8f32db83842fc5b279caf84c6e	willow.cheng
cm8eoxq7i003gs60h9clhrv79	thom.heasman@shopify.com	thom.heasman	https://www.gravatar.com/avatar/c00cfd702677b37fa5c757e522abfd2f	thom.heasman
cm8eozabi003hs60hwv83es2p	anthony.prestanizzi@shopify.com	anthony.prestanizzi	https://www.gravatar.com/avatar/34cea911b964711e5d8514b6b65e903b	anthony.prestanizzi
cm8epbkwd003qs60h1nfu93ph	jenny.walsh@shopify.com	jenny.walsh	https://www.gravatar.com/avatar/0cd6593d20f4d4bb3360576eca95c9dd	jenny.walsh
cm8ephhi6003rs60hgb8mdb89	yikai.zhang@shopify.com	yikai.zhang	https://www.gravatar.com/avatar/0ec9ae50b8bfea5fed302421eae41de1	yikai.zhang
cm8epjwfh003ss60ha4joh9mh	ke.chen@shopify.com	ke.chen	https://www.gravatar.com/avatar/8026b365eb7eb05752d0df0a329a4490	ke.chen
cm8epnfd5003ts60hi0ngdkga	jane.kim2@shopify.com	jane.kim2	https://www.gravatar.com/avatar/9690dc377e92eb320db704d143a8b13d	jane.kim2
cm8epnkhc003us60hu3lxw394	anh.dinh@shopify.com	anh.dinh	https://www.gravatar.com/avatar/ff604498869a7f2e3a7b31dbe7539b34	anh.dinh
cm8epoymt003vs60hpditqvq9	keith.brouillette@shopify.com	keith.brouillette	https://www.gravatar.com/avatar/747b4dc36d590d3e2d026a0fac45a5bf	keith.brouillette
cm8eppynb003ws60h81mtnp4e	kyle.weeks@shopify.com	kyle.weeks	https://www.gravatar.com/avatar/14fd581727a7d5de23a219132ab61221	kyle.weeks
cm8epqcuw003xs60hs4dloj14	courtney.verk@shopify.com	courtney.verk	https://www.gravatar.com/avatar/2cca2b51e0df0ab25e99978364af9e27	courtney.verk
cm8epuk4q003zs60hxlthxsmk	sue.duffy@shopify.com	sue.duffy	https://www.gravatar.com/avatar/51bd3cc9af04cfdfd9240750beec5392	sue.duffy
cm8epuv2c0040s60h08jnbr1q	mahta.moattari@shopify.com	mahta.moattari	https://www.gravatar.com/avatar/ab02020283181c1c8ebb063fbd29187a	mahta.moattari
cm8epwkum0041s60hk1t2o46s	andy.wood@shopify.com	andy.wood	https://www.gravatar.com/avatar/e37da8527ec0afaabea8bc96c33462f1	andy.wood
cm8epxomj0042s60henf3e0n1	jessica.kwan@shopify.com	jessica.kwan	https://www.gravatar.com/avatar/ad9b2def3e4ccbdf41b760928e3e4800	jessica.kwan
cm8epxv280043s60hvpon7fez	chris.jones@shopify.com	chris.jones	https://www.gravatar.com/avatar/9ee47ae5973afb72ac982a9c96433768	chris.jones
cm8epsttz003ys60homho5ud3	ricky.kam@shopify.com	Ricky Kam	https://www.gravatar.com/avatar/ed6c10fa11aa4b9fb8dd4aa4d6996f9d	ricky.kam
cm8epz4vv0044s60h0t5xt7n7	nik.dudukovic@shopify.com	nik.dudukovic	https://www.gravatar.com/avatar/d914df919bfdeb2e0f56e59b20ee2fb1	nik.dudukovic
cm8eq06tt0045s60h0fwyue8v	timothy.quirino@shopify.com	timothy.quirino	https://www.gravatar.com/avatar/5228a9d7ddf7e515250f924835d25c53	timothy.quirino
cm8eq243c0046s60heri5478x	phillip.elie@shopify.com	phillip.elie	https://www.gravatar.com/avatar/ffc3ded34515e789a8825e3258d185c6	phillip.elie
cm8eq5i570047s60hcb1tqbbz	michelle.gerrarddoyle@shopify.com	michelle.gerrarddoyle	https://www.gravatar.com/avatar/16259333b086ae1f8a84a90cc1633609	michelle.gerrarddoyle
cm8eq62qs0048s60h70o1lvgd	stephanie.rieger@shopify.com	stephanie.rieger	https://www.gravatar.com/avatar/45e52eeadfed7ee5d23b3f16c3c8a7e1	stephanie.rieger
cm8eq9nx10049s60h7i31r9eo	nathan.davis@shopify.com	nathan.davis	https://www.gravatar.com/avatar/02d92ff2feff3cf1bbeaeb7c19df460d	nathan.davis
cmebv1mm6000ls60hle05iamb	sara.kim@shopify.com	sara.kim	https://www.gravatar.com/avatar/295f08b7bc1fa21bc5e4948382c37d87	sara.kim
cm8eqggr20001s60hsvpv1yk4	eric.greene@shopify.com	eric.greene	https://www.gravatar.com/avatar/a8ca8bae0de6ff6561d915fbdad107ed	eric.greene
cm8eqh9wo0002s60htqsgawqh	flora.mcneill@shopify.com	flora.mcneill	https://www.gravatar.com/avatar/e75e3ae05d93e69e6c9aab70142043ec	flora.mcneill
cm8eqiaqa0004s60h5jnuu2om	claire.moore@shopify.com	claire.moore	https://www.gravatar.com/avatar/8913add209ea2dc4a547d21951f50330	claire.moore
cm8eqkabv0005s60hbru8ahf7	katy.cobb@shopify.com	katy.cobb	https://www.gravatar.com/avatar/e94f3c470db85b40f89744b070acae8d	katy.cobb
cm8eqma210006s60hfkqsy8hc	madison.jerde@shopify.com	madison.jerde	https://www.gravatar.com/avatar/21efbda72d75559070eebb299ed4d264	madison.jerde
cm8eqon200007s60hgu1bmv3w	carrie.andersen@shopify.com	carrie.andersen	https://www.gravatar.com/avatar/50a0c032a770bab9fd889ea7c4f12d98	carrie.andersen
cm8eqqq0k0008s60hkwmaqiuj	quentin.dietrich@shopify.com	quentin.dietrich	https://www.gravatar.com/avatar/8d73c0b28bc5d5d64eb332765c979d25	quentin.dietrich
cm8eqqyjw0009s60hts0q80bu	olivia.marcello@shopify.com	olivia.marcello	https://www.gravatar.com/avatar/cc9d47c0be76a55dc381972dc82f119c	olivia.marcello
cm8eqsgiu000as60h0er9t580	david.luong@shopify.com	david.luong	https://www.gravatar.com/avatar/7bda536e8ea1ea7a1bfa2cca72733f02	david.luong
cm8eqtiyv000bs60h37ccpifh	jason.cale@shopify.com	jason.cale	https://www.gravatar.com/avatar/f77e70340ee767290f299d82287bae34	jason.cale
cm8equpw2000fs60h6spefrpk	sadie.redden@shopify.com	sadie.redden	https://www.gravatar.com/avatar/ef73996a650c605f8a44bd7597d07913	sadie.redden
cm8eqvex5000gs60hlv2qf6p0	danielle.hollander@shopify.com	danielle.hollander	https://www.gravatar.com/avatar/4af72f307173a453943916ffc947e9bb	danielle.hollander
cm8eqx51d000hs60hmc6mel7r	lauren.williamson@shopify.com	lauren.williamson	https://www.gravatar.com/avatar/976692bcd2d9340751d8566d95cbd42c	lauren.williamson
cm8er27yw0000s60h8ewpyq20	sascha.hopson@shopify.com	sascha.hopson	https://www.gravatar.com/avatar/a6cbf5f7560bc407dcd5e7fefc317946	sascha.hopson
cm8er6k0b0001s60htqb786cb	jaymez.clark@shopify.com	jaymez.clark	https://www.gravatar.com/avatar/a2878f5b4ccf54dc4eb05cee86065534	jaymez.clark
cm8eq9rrd004as60h7in8f922	edmund.teh@shopify.com	edmund	https://www.gravatar.com/avatar/4a176b551cfe2b779868d6ac6da31c47	edmund.teh
cm8erimn60002s60h9adsg5qt	emma.shanahan@shopify.com	emma.shanahan	https://www.gravatar.com/avatar/5b0061e8e7699aec1ba629304deee732	emma.shanahan
cm8erozd20005s60h3n1u3taw	tobias.negele@shopify.com	toby.negele	https://www.gravatar.com/avatar/5a45a9a471e63b0bef7dff77f72cbb6b	tobias.negele
cm8ero0uk0004s60hgizfuzxc	ross.diener@shopify.com	ross.diener	https://www.gravatar.com/avatar/b1b829dad5c3f017b6f124ccc51f35f8	ross.diener
cm8erp1zv0006s60h7vhzirm7	alex.weinstein@shopify.com	alex.weinstein	https://www.gravatar.com/avatar/3f1e5e953b66ba02112010b055ae2824	alex.weinstein
cm8ery03y000as60hz7jvs7qp	claudio.munoz@shopify.com	claudio.munoz	https://www.gravatar.com/avatar/2b03d45e1977b1ddcdfcf467a108a207	claudio.munoz
cm8es46rp000ns60hh6rgvsh4	jenna.stephenswells@shopify.com	jenna.stephenswells	https://www.gravatar.com/avatar/bd7b345db48f8b4c678fca4b919db69c	jenna.stephenswells
cm8esecmh000ws60hpmiei9hs	lisa.hart@shopify.com	lisa.hart	https://www.gravatar.com/avatar/2f7eae3d8cf69c09daba33082ff00720	lisa.hart
cm8eseo7o000xs60hbnjmmnxy	shannon.hayward@shopify.com	shannon.hayward	https://www.gravatar.com/avatar/5941fa5c3d247cd1b1fc1f0750f2dad1	shannon.hayward
cm8esf3rq000ys60hv7l3k2vy	chris.appleton@shopify.com	chris.appleton	https://www.gravatar.com/avatar/0d8d90148a856f07c5877f448fccd35e	chris.appleton
cm8esfajo000zs60hv5rj38a6	bojan.antic@shopify.com	bojan.antic	https://www.gravatar.com/avatar/cbe1925c78c52d8d4f123c4ac84ad58d	bojan.antic
cm8esfinv0010s60hye1l9kjh	vaibhav.yadaram@shopify.com	vaibhav.yadaram	https://www.gravatar.com/avatar/b6a249346311de7178f965025cad4ffd	vaibhav.yadaram
cm8esfwi60011s60hgz6d5ynx	raul.reyescano@shopify.com	raul.reyescano	https://www.gravatar.com/avatar/a3fbbac22597613c5596af81424fd757	raul.reyescano
cm8esfxca0012s60hsj0judk5	brad.kratky@shopify.com	brad.kratky	https://www.gravatar.com/avatar/b7e3322073c95c90eb71ca90701cda12	brad.kratky
cm8esh9sh0013s60hr9no9c0z	michael.defazio@shopify.com	michael.defazio	https://www.gravatar.com/avatar/5d464dc4c2662982a2606514e48dedd9	michael.defazio
cm8eshxoc0014s60hiayezo0u	patty.anasco@shopify.com	patty.anasco	https://www.gravatar.com/avatar/14af2eb9a636a4ff38ba3e63dcbe5863	patty.anasco
cm8esi6pj0015s60hlx78ank5	nicole.karolczyk@shopify.com	nicole.karolczyk	https://www.gravatar.com/avatar/64011c63d513ebcbac9ef75306cf3e83	nicole.karolczyk
cm8esi6pm0016s60hjjebqdrq	morgan.holland@shopify.com	morgan.holland	https://www.gravatar.com/avatar/a804f0d1130ff39f0caebe7cee9e5bc3	morgan.holland
cm8esiwsd0017s60hart2lhg8	vickram.ramchandani@shopify.com	vickram.ramchandani	https://www.gravatar.com/avatar/7cb6af3b3392fb6886b2781b357e1f06	vickram.ramchandani
cm8esj0vr0018s60hs0to5z5v	brian.vo@shopify.com	brian.vo	https://www.gravatar.com/avatar/df217b76362b9782faa25a2ee11a0bab	brian.vo
cm8esjosu0019s60hkpel5rqd	galyna.kaplan@shopify.com	galyna.kaplan	https://www.gravatar.com/avatar/ad7e502f673de3cae0adfcf752ac2791	galyna.kaplan
cm8esmm07001as60hjwhodidz	michael.welfle@shopify.com	michael.welfle	https://www.gravatar.com/avatar/f0b414d6f1272d276166ea70f33f064c	michael.welfle
cm8esnr6c001bs60hn3q83uey	ramon.duraes@shopify.com	ramon.duraes	https://www.gravatar.com/avatar/990c9295e474388cd7ab5b5b912b5311	ramon.duraes
cm8esof46001cs60hm8sbabdj	richard.btaiche@shopify.com	richard.btaiche	https://www.gravatar.com/avatar/d7fc647e5714c30e1f01fb8f2afe208d	richard.btaiche
cm8esps7z001ds60hj1gj9x0x	taryn.kurcz@shopify.com	taryn.kurcz	https://www.gravatar.com/avatar/f0d60e269952bc5d77acb199d6331d6c	taryn.kurcz
cm8esqbp7001es60hzgb9do2x	amanda.klee@shopify.com	amanda.klee	https://www.gravatar.com/avatar/b72d80599dd86b40ef45caff76b38aad	amanda.klee
cm8esrwdv001fs60hpi5ug8v0	kate.richards@shopify.com	kate.richards	https://www.gravatar.com/avatar/695a53ec11a2113b0339da2280d5790a	kate.richards
cm8estunb001gs60hb0dy1vlu	cory.connelly@shopify.com	cory.connelly	https://www.gravatar.com/avatar/cb7588cef19dbe921271ae82e35f7be5	cory.connelly
cm8nrfl2o0000s60h474pczud	dane.sun@shopify.com	dane.sun	https://www.gravatar.com/avatar/b69408421906d3079afc729cfc6e3973	dane.sun
cm8em6fwr002fs60h69moo9ct	joseph.kim@shopify.com	Joseph Kim	https://www.gravatar.com/avatar/0d56d5a3a2629628fcc38222a75be60a	joseph.kim
cm8esumwt001hs60hyjawr2ll	jenny.stanchak@shopify.com	jenny.stanchak	https://www.gravatar.com/avatar/d8851e14e6339fff14a8e29c98703e3e	jenny.stanchak
cm8esvnsf001is60hw2fnzd6b	gavin.harvey@shopify.com	gavin.harvey	https://www.gravatar.com/avatar/0c7dc3967c466380090a01babe327909	gavin.harvey
cm8esx4wv001js60hhvtuye21	arthur.camberlein@shopify.com	arthur.camberlein	https://www.gravatar.com/avatar/ad52a8e440c494d925561a141c367498	arthur.camberlein
cm8esxb3o001ks60hbnd37kap	melinda.swart@shopify.com	melinda.swart	https://www.gravatar.com/avatar/c49be694b6946e4da50731249d1c83ee	melinda.swart
cm8esy8jj001ls60hb6p4i3ne	rory.tanner@shopify.com	rory.tanner	https://www.gravatar.com/avatar/0bba34c0c20081f0e5fea8fff8d637cf	rory.tanner
cm8eszca8001ms60h5bjh1yvp	thomas.brown@shopify.com	thomas.brown	https://www.gravatar.com/avatar/8409a26d8d7a9be14556e7bbf97e75fb	thomas.brown
cm8et0idx001ns60hpg2sqq0r	mikey.gough@shopify.com	mikey.gough	https://www.gravatar.com/avatar/66a85d4e627765bfb81241093f4d3491	mikey.gough
cm8et0mll001os60hur57r92s	leonardo.pereira@shopify.com	leonardo.pereira	https://www.gravatar.com/avatar/b1ee21e0bbc1464c9e4448f717fbc875	leonardo.pereira
cm8et16hj001ps60hdtafyae0	hanna.bennett@shopify.com	hanna.bennett	https://www.gravatar.com/avatar/bcd86c881307bb509ee76d1d9ee5eb7f	hanna.bennett
cm8et181v001qs60hjqt3qupa	maude.trudeau@shopify.com	maude.trudeau	https://www.gravatar.com/avatar/c9fbd41128bc92c41d6fff8106bd1316	maude.trudeau
cm8et2h2w001rs60hcvl5rgko	paulo.casaretto@shopify.com	paulo.casaretto	https://www.gravatar.com/avatar/879724cbc9d022ebf7b2c62922c2cb69	paulo.casaretto
cm8et2xxw001ss60hczizelq2	josh.mitchinson@shopify.com	josh.mitchinson	https://www.gravatar.com/avatar/3bd3cfb48392796273ef6ff68f98b6af	josh.mitchinson
cm8et7o9u001ws60hoxisw1er	joe.hitchcock@shopify.com	joe.hitchcock	https://www.gravatar.com/avatar/cb2f8374032e096572a3cb692b8ceb49	joe.hitchcock
cm8et8cgy001xs60hpgzxa7gd	boris.jovic@shopify.com	boris.jovic	https://www.gravatar.com/avatar/b1dd58c4225a07913cbdcee62f8762b9	boris.jovic
cm8et973x0021s60hr0vv4y5r	nick.tchir@shopify.com	nick.tchir	https://www.gravatar.com/avatar/49cfda73ebbac4b2983e6453eff63e84	nick.tchir
cm8etdrpr0022s60ho61sbpqb	madhulika.saxena@shopify.com	madhulika.saxena	https://www.gravatar.com/avatar/96864d22ce80e29a680db47a4a8286fb	madhulika.saxena
cm8etfosy0023s60h6syt64oj	sahil.khoja@shopify.com	sahil.khoja	https://www.gravatar.com/avatar/e5d3310398d1d7b19def73c90f9b222c	sahil.khoja
cm8etpeqw0027s60hc80uvp9r	justin.arak@shopify.com	justin.arak	https://www.gravatar.com/avatar/c1b7123c1130f9cc14aa9d7bcc790528	justin.arak
cm8etpjkm002bs60h909zlee6	adrienne.tsang@shopify.com	adrienne.tsang	https://www.gravatar.com/avatar/0b5b6a394c0da4f91deda11b49d05b12	adrienne.tsang
cm8etpnsw002cs60hih44zrhc	mario.ferrer@shopify.com	mario.ferrer	https://www.gravatar.com/avatar/3dbe537de273c68d5e7cc07f90a2208c	mario.ferrer
cm8etqgw7002ds60hxutjrzw6	stuart.trann@shopify.com	stuart.trann	https://www.gravatar.com/avatar/25725922b7b21632355bb6430eb8e363	stuart.trann
cm8etu59v002hs60hqp5ear4c	monique.baenatan@shopify.com	monique.baenatan	https://www.gravatar.com/avatar/76cef9008b77c4e6fd563b513dceaf8a	monique.baenatan
cm8etx08s002is60hfs4tuxhs	jeansebastien.letellier@shopify.com	jeansebastien.letellier	https://www.gravatar.com/avatar/b9ed83beaf1579d990046c258c9ab574	jeansebastien.letellier
cm8etyse8002js60htgrx9qai	tif.flowers@shopify.com	tif.flowers	https://www.gravatar.com/avatar/452fb5fe8606b5aa191352beb7ab7213	tif.flowers
cm8eu7rma002ss60hly65jbvi	lydia.shan@shopify.com	lydia.shan	https://www.gravatar.com/avatar/4fe3eace55026e92e4438220a82ffcc5	lydia.shan
cm8eu9b28002ws60hiwh2r3oq	greg.bernhardt@shopify.com	greg.bernhardt	https://www.gravatar.com/avatar/b1a0b42f2693095cf24dfb87e445e3be	greg.bernhardt
cm8eujj4a0039s60hdme94ffn	sarah.mcdonald@shopify.com	sarah.mcdonald	https://www.gravatar.com/avatar/d8e8a84f8df0b5ff3b7d5f39f95132f2	sarah.mcdonald
cm8eul0n3003as60hwdsmu34g	julia.yach@shopify.com	julia.yach	https://www.gravatar.com/avatar/6fda7628fae52dd8c3efd71e69465d99	julia.yach
cm8eumzyz003bs60h8m14k7f6	samuel.greggwallace@shopify.com	samuel.greggwallace	https://www.gravatar.com/avatar/a851ee25935e15cb6ac5057d12affb2a	samuel.greggwallace
cm8euphnr003cs60hbk4cfos8	lauren.ip@shopify.com	lauren.ip	https://www.gravatar.com/avatar/3289070f26cf7b078fc14a57136d9380	lauren.ip
cm8euq4qf003ds60hq9zfiwi8	cherry.chau@shopify.com	Cherry Chau	https://www.gravatar.com/avatar/839659acae97be302b0f7d2c9b79a5d1	cherry.chau
cm8euz86v003es60hio66x1qn	selena.latchman@shopify.com	selena.latchman	https://www.gravatar.com/avatar/a38e013501e3a6b4a0985b9e73f20e13	selena.latchman
cm8ev050c003fs60hl2cyyugr	dave.shea@shopify.com	dave.shea	https://www.gravatar.com/avatar/c5a4e9ee5eeb8b5b6f90e1b9bb6dac0f	dave.shea
cm8evdz6z003gs60h47b68oe1	atlee.clark@shopify.com	atlee.clark	https://www.gravatar.com/avatar/2fba66644dbd24d0a1bf7400bdfc4238	atlee.clark
cm8evh5bq003hs60hxw7kyx14	janice.chow@shopify.com	janice.chow	https://www.gravatar.com/avatar/9516014425b5ba18ddc607694388327d	janice.chow
cm8evlg2v003is60hhtx5a0l2	mathieu.legault@shopify.com	mathieu.legault	https://www.gravatar.com/avatar/56a52a2dd24c9adb3b60206dddbb4e31	mathieu.legault
cm8evpbuv003js60hh5hluer0	evany.thomas@shopify.com	evany.thomas	https://www.gravatar.com/avatar/2ae70b413bf65bdeb599a6f7533d53f2	evany.thomas
cm8evzr5e003ks60hyrme7w10	joey.herring@shopify.com	joey.herring	https://www.gravatar.com/avatar/70aa67fe57807a1de133c1660789ae38	joey.herring
cm8ew2swb003ls60h71p3qqml	lizzie.macneill@shopify.com	lizzie.macneill	https://www.gravatar.com/avatar/378ec2ef68a5f94e45bea30ba02312ee	lizzie.macneill
cm8ew38st003ms60hbp57wi8f	alex.amaral@shopify.com	alex.amaral	https://www.gravatar.com/avatar/01f342c585360017f4562e44f506372b	alex.amaral
cm8ewpwv3003ns60hw545zur5	chienju.peng@shopify.com	chienju.peng	https://www.gravatar.com/avatar/3e0ee57d62891b254efc6628f029451d	chienju.peng
cm8exb8yi003os60hvpd5ivdq	jordan.wille@shopify.com	jordan.wille	https://www.gravatar.com/avatar/5494edd8178fbed34c89f76e3c4a57ad	jordan.wille
cm8exosvw003ps60hjvksbe9x	danica.dillera@shopify.com	danica.dillera	https://www.gravatar.com/avatar/bf9c47c782e584211bf42ebd2d286d1a	danica.dillera
cmebv1yu7000ms60hynsljo09	dustin.holmstrom@shopify.com	dustin.holmstrom	https://www.gravatar.com/avatar/45f253a94af7fbd48a482b2f658eb9c8	dustin.holmstrom
cm8exriia003rs60hzocp8kvi	iesha.holenchuk@shopify.com	iesha.holenchuk	https://www.gravatar.com/avatar/ddd48295f450d1535d300dc26df84332	iesha.holenchuk
cm8exy3ag003ss60h1u4aju6q	aisleen.santos@shopify.com	aisleen.santos	https://www.gravatar.com/avatar/2fdd612cf0781a1b5e4d156e24c88879	aisleen.santos
cm8ey3v9z003ts60htzd99he5	joe.rinaldijohnson@shopify.com	joe.rinaldijohnson	https://www.gravatar.com/avatar/58fcc87675956b09eaf12c81ba5c7feb	joe.rinaldijohnson
cm8eyz6l1003ws60hc4o21y1e	steve.buffee@shopify.com	steve.buffee	https://www.gravatar.com/avatar/9896de78fd421ed7f31e8a0ce0022e15	steve.buffee
cm8ezeu0l003xs60hwhkfqf5m	simon.callsen@shopify.com	simon.callsen	https://www.gravatar.com/avatar/461d7038c2cfb4face1e9f509fd4939a	simon.callsen
cm8f0g828003ys60hehgj267t	sai.nihas@shopify.com	sai.nihas	https://www.gravatar.com/avatar/0a2a0e9d934d6fae76004b1018e17118	sai.nihas
cm8f0h0u2003zs60hvvnnh3vz	julian.liao@shopify.com	julian.liao	https://www.gravatar.com/avatar/ecd16b4dfc33cf0dc3c5d845e716001c	julian.liao
cm8exr4mq003qs60hcxg1wm7v	ryan.quintal@shopify.com	Ryan Quintal	https://www.gravatar.com/avatar/4410fe0c2220e5eb9871b43ac9bee28f	ryan.quintal
cm8f18naj0046s60hjuxphi2w	richard.li@shopify.com	richard.li	https://www.gravatar.com/avatar/5d533941a11d942a5b0bff84eff9650b	richard.li
cm8f1ep5a0047s60hm8wyww85	taha.eldeib@shopify.com	taha.eldeib	https://www.gravatar.com/avatar/ef64c775a6394763781d5a5ff5c6c940	taha.eldeib
cm8f1o7qx0048s60h5svg2u63	arda.karacizmeli@shopify.com	arda.karacizmeli	https://www.gravatar.com/avatar/7a99bfbf7c512df78053f934e476193c	arda.karacizmeli
cm8f1rww4004cs60h6988nojl	owen.anderson@shopify.com	owen.anderson	https://www.gravatar.com/avatar/1594f09756c23a8e9db1f358b7c48f28	owen.anderson
cm8f2kjlq004ds60hunv0nb91	marisa.chan@shopify.com	marisa.chan	https://www.gravatar.com/avatar/4069e264857add506d4d5772aafb4c4d	marisa.chan
cm8f2ow7t004es60hxww979b2	alana.maharaj@shopify.com	alana.maharaj	https://www.gravatar.com/avatar/3dd8702430cf6f06757054d4f558a484	alana.maharaj
cm8f3mc5w004gs60hykmeheqf	rich.brown@shopify.com	rich.brown	https://www.gravatar.com/avatar/047e7b8b5236eb502b79a672703d784b	rich.brown
cm8f40ste004hs60hjt1dvgiv	mustafa.kurtuldu@shopify.com	mustafa.kurtuldu	https://www.gravatar.com/avatar/729c2ca1fdcdcac9a12fb139b085a92a	mustafa.kurtuldu
cm8f4fhjn004is60h2p7gxe1f	angus.lei@shopify.com	angus.lei	https://www.gravatar.com/avatar/fa55cf07f21d8470b285675bf7858e1f	angus.lei
cm8f7bgm30000s60hppdd0h38	katrina.schwieterman@shopify.com	katrina.schwieterman	https://www.gravatar.com/avatar/83ac6f4a7756b7d411c4d6283bf404a0	katrina.schwieterman
cm8fbdrf40003s60hkxexwth4	yuanqing.lim@shopify.com	yuanqing.lim	https://www.gravatar.com/avatar/2b12bdf91a509b797e5bf3283b6cac4c	yuanqing.lim
cm8fooc9k0000s60h04mvpber	lucia.cedron@shopify.com	lucia.cedron	https://www.gravatar.com/avatar/ad6052a3ded03ada6feaae56c71a51a8	lucia.cedron
cm8fqbfye0000s60h5qe6g4gf	jaime.cepeda@shopify.com	jaime.cepeda	https://www.gravatar.com/avatar/de0c338d06031a825ced6ddce1ca4f87	jaime.cepeda
cm8fr1ote0000s60hsgrqfha1	kasia.krotki@shopify.com	kasia.krotki	https://www.gravatar.com/avatar/d16a4b319af3a52178cff37b346f4828	kasia.krotki
cm8fu2ouf0000s60h63koa4jr	nicola.evans@shopify.com	nicola.evans	https://www.gravatar.com/avatar/e92a06e59e2cc69cb3404ea7f95692ba	nicola.evans
cm8fu5ufs0001s60hu0u9o0g5	kris.luttmer@shopify.com	kris.luttmer	https://www.gravatar.com/avatar/2a451445ededa89e25b3c23ab949bb52	kris.luttmer
cm8fwrxod0000s60hp78vbutv	kathleen.robertson@shopify.com	kathleen.robertson	https://www.gravatar.com/avatar/d4c8de1d8677fb79d1cb9f742b82cd73	kathleen.robertson
cm8fxd32s0001s60hu3yxvbtp	joelle.sasseville@shopify.com	joelle.sasseville	https://www.gravatar.com/avatar/1e00bebf69ff1ec480697165218b5980	joelle.sasseville
cm8fxon760002s60hqveasvmv	carl.rivera@shopify.com	carl.rivera	https://www.gravatar.com/avatar/c5bdf5bd4252da1feba46c7fe4d518a5	carl.rivera
cm8fxri6r0003s60hhr8nctcl	rozina.szogyenyi@shopify.com	rozina.szogyenyi	https://www.gravatar.com/avatar/561ac8f098842c16427d9441c0a522b0	rozina.szogyenyi
cm8fxsj4k0004s60hbfp7mlbp	ali.amarshi@shopify.com	ali.amarshi	https://www.gravatar.com/avatar/ca0a82813f361ec281f2b50e806cc66a	ali.amarshi
cm8fyv6xs0007s60h8mmy9uqd	david.goligorsky@shopify.com	david.goligorsky	https://www.gravatar.com/avatar/ac2262057aa7f0c4b20e9c00d72a7935	david.goligorsky
cm8fywi4r0008s60hkqyr1qll	eduardo.lipe@shopify.com	eduardo.lipe	https://www.gravatar.com/avatar/0f4474d9ec477597e616808b808dd727	eduardo.lipe
cmebv27he000ns60hsidn6eix	alexis.katigbak@shopify.com	alexis.katigbak	https://www.gravatar.com/avatar/31ef4af9df58be22722bf60715d9a9d4	alexis.katigbak
cm8fzh7v2000gs60h6cd3zblw	matt.halliday@shopify.com	matt.halliday	https://www.gravatar.com/avatar/7b4ce6106567fd487d5fe39405437680	matt.halliday
cm8fzkskb000hs60h2sfnj4xm	olivia.truong@shopify.com	olivia.truong	https://www.gravatar.com/avatar/01335ce2cf269d7a71323a056fb03b86	olivia.truong
cm8g0128k000is60hwsaley1r	christopher.lo@shopify.com	christopher.lo	https://www.gravatar.com/avatar/a76458a3e85b96c890436475e8f2ec21	christopher.lo
cm8g02euc000js60hwmqours2	sarah.klem@shopify.com	sarah.klem	https://www.gravatar.com/avatar/95a08197153277f2ae7c832551cb7efc	sarah.klem
cm8g0tssb000ks60hgqq0uze0	ramsha.naeem@shopify.com	ramsha.naeem	https://www.gravatar.com/avatar/f289f7ba5d930d1858124675971727d1	ramsha.naeem
cm8g0zwla000ls60h0gvdzrif	thomas.jonkajtys@shopify.com	thomas.jonkajtys	https://www.gravatar.com/avatar/bcc115863e858f2af01593022f051a0b	thomas.jonkajtys
cm8g327cz000ms60hi2s20a85	kd.tabie@shopify.com	kd.tabie	https://www.gravatar.com/avatar/7a809056d9aa242a3cc1614c4cf8408f	kd.tabie
cm8g391ei000ns60hq07lz451	dani.chavezackermann@shopify.com	dani.chavezackermann	https://www.gravatar.com/avatar/b1fa17c775c434db1014e73d0b75b761	dani.chavezackermann
cm8g41yvo000qs60h2axfbu6x	bill.brower@shopify.com	bill.brower	https://www.gravatar.com/avatar/24ea45468896e872d0454077cce968f4	bill.brower
cm8g4af8p000rs60hj46zdp7r	john.imburgia@shopify.com	john.imburgia	https://www.gravatar.com/avatar/b4aaa62d043cc2418fffcfb0b56e7a0b	john.imburgia
cm8g4oj1z000ss60hol8inmil	kim.estoesta@shopify.com	kim.estoesta	https://www.gravatar.com/avatar/64d73386814f0c683be9769615c2f961	kim.estoesta
cm8g5dsmz000ts60hk4913ehy	soojin.cha@shopify.com	soojin.cha	https://www.gravatar.com/avatar/0643072689e7636a0cd7d59cc7dff537	soojin.cha
cm8g69sc8000us60hpmshf8ao	emily.colby@shopify.com	emily.colby	https://www.gravatar.com/avatar/7ef183100c5f35bd032851e201f32972	emily.colby
cm8g72wee000vs60hmfyncobd	nicolas.tual@shopify.com	nicolas.tual	https://www.gravatar.com/avatar/bc7375bcc265cddb8cc5b03de1363297	nicolas.tual
cm8g7g86k000ws60hku489cad	jess.bottali@shopify.com	jess.bottali	https://www.gravatar.com/avatar/76be24fd34d499fb20bc7fdfd9af5ee7	jess.bottali
cm8g7n07x000xs60hext20mbs	mustafa.ali@shopify.com	mustafa.ali	https://www.gravatar.com/avatar/96f18f1247ee065a17161d74bbf29ba1	mustafa.ali
cm8g9vp400000s60hnwzkrtd1	jack.read@shopify.com	jack.read	https://www.gravatar.com/avatar/287a935f19680e168421a10d9488b275	jack.read
cm8ga0f7c0001s60hyzrr3mpz	natalie.orcutt@shopify.com	natalie.orcutt	https://www.gravatar.com/avatar/04624f17de61d6dce8a6174e455ee289	natalie.orcutt
cm8gacbrl0002s60hdepy7bws	thaira.bouhid@shopify.com	thaira.bouhid	https://www.gravatar.com/avatar/2df898b533e0a23840082fe33743a087	thaira.bouhid
cm8gau0h00003s60hy0lbmqrl	john.comar@shopify.com	john.comar	https://www.gravatar.com/avatar/378dbd5dbb7d67d48ff48bfd3e14ec94	john.comar
cm8gb1wkz0004s60hqv6vpj7q	jesh.read@shopify.com	jesh.read	https://www.gravatar.com/avatar/d2aade23d99c575028f2dc31c733b0b6	jesh.read
cm8gb7jje0005s60hoz9oa1xb	ben.chacon@shopify.com	ben.chacon	https://www.gravatar.com/avatar/bbbd617cc52ecb71f4f8776b431a4366	ben.chacon
cm8gbyp6p0006s60h7u1c759x	genevieve.monette@shopify.com	genevieve.monette	https://www.gravatar.com/avatar/9eb834b4f07233b62e88c5193188b7fd	genevieve.monette
cm8gc2the0007s60hj36axyv9	felipe.fiuza@shopify.com	felipe.fiuza	https://www.gravatar.com/avatar/c7eca5e283642c09484b0ccf50cd00df	felipe.fiuza
cm8gcyoie0008s60ha23miix2	theresa.paul@shopify.com	theresa.paul	https://www.gravatar.com/avatar/70344b57ed8199dc7d01eba8213bda9a	theresa.paul
cm8ggdz9b0000s60hm651eb4x	chris.hastingsspital@shopify.com	chris.hastingsspital	https://www.gravatar.com/avatar/94ebae864dc79f925d6315b865ac28c0	chris.hastingsspital
cm8h0fzf10000s60hsvme88z3	jason.kim@shopify.com	jason.kim	https://www.gravatar.com/avatar/9668dab87acd6a9de90ee5d36223756d	jason.kim
cm8hfo85u0002s60hrw71e8v4	simone.arora@shopify.com	simone.arora	https://www.gravatar.com/avatar/4d10b77a132d0a15d859dab932ac94fa	simone.arora
cm8hh3hk30003s60hqsepcqxm	chaitanya.bilgikar@shopify.com	chaitanya.bilgikar	https://www.gravatar.com/avatar/669950852ac7b4b7b9483406def105d4	chaitanya.bilgikar
cm8hh3wrx0004s60hmg6h7o07	olivier.wilkinson@shopify.com	olivier.wilkinson	https://www.gravatar.com/avatar/4cb5beb233e99bc97f21dafda2d3fe76	olivier.wilkinson
cm8hh495k0005s60hmd3q2wao	jacob.shafer@shopify.com	jacob.shafer	https://www.gravatar.com/avatar/80cd79266ba6996dfe33ebc19e1a6d00	jacob.shafer
cm8hh4gyz0006s60hyyq96od2	jared.guttromson@shopify.com	jared.guttromson	https://www.gravatar.com/avatar/981d76e2bf0ba29c5eb64b588c81b014	jared.guttromson
cm8hhsb850000s60huy0dnlfe	jessica.harllee@shopify.com	jessica.harllee	https://www.gravatar.com/avatar/7573612b942c69ee07d1cfff11686c56	jessica.harllee
cm8hi0xco0001s60h0omgywsh	kate.icely@shopify.com	kate.icely	https://www.gravatar.com/avatar/10286e93a64c556639ab5262c0bdaa67	kate.icely
cm8hiiwlc0004s60h9o1yozwa	fisher.manning@shopify.com	fisher.manning	https://www.gravatar.com/avatar/3ea572595b84f4cc530923d6d1aa3356	fisher.manning
cm8fz1xgd0009s60hchu9d1jd	felicia.evangeline@shopify.com	felicia.evangeline	https://www.gravatar.com/avatar/bba7ab9461e6920c2645a4419a6fc1af	felicia.evangeline
cm8hk074x0000s60h7ovn0em7	brad.feeley@shopify.com	brad.feeley	https://www.gravatar.com/avatar/234583eed45d72b084b3699333bc079f	brad.feeley
cm8hm62380000s60hdm8kycpv	alex.anderson@shopify.com	alex.anderson	https://www.gravatar.com/avatar/aaa5e67810cd7fe87dccf51b79c6501c	alex.anderson
cm8hn2wd20001s60hue7xwfs0	ricardo.queiroz@shopify.com	ricardo.queiroz	https://www.gravatar.com/avatar/cdcc666175a6cd124071f62909dc7a1d	ricardo.queiroz
cm8ho981z0000s60hj3k46sur	sabrina.wishak@shopify.com	sabrina.wishak	https://www.gravatar.com/avatar/b7206323ffca9aa846c94dea54eee9b0	sabrina.wishak
cm8ho981z0001s60ho60edil4	samantha.cribbie@shopify.com	samantha.cribbie	https://www.gravatar.com/avatar/d6c3a0bdeb647cc7cd2a57f608c69684	samantha.cribbie
cm8ho98210002s60h7gcckpaz	andrew.schiller@shopify.com	andrew.schiller	https://www.gravatar.com/avatar/64480c613c27b9a9138d3ffd8f92c5b8	andrew.schiller
cm8ho9eee0003s60hy1dmykrb	courtney.mccune@shopify.com	courtney.mccune	https://www.gravatar.com/avatar/31803bda1dafa15a69030959285c81e6	courtney.mccune
cm8ho9wsf0004s60heqi11vbr	anna.magolonparobek@shopify.com	anna.magolonparobek	https://www.gravatar.com/avatar/2e81255232220fc53d911c6449b71f3f	anna.magolonparobek
cm8hp0ra90000s60hhxdlvx2c	dee.elise@shopify.com	dee.elise	https://www.gravatar.com/avatar/a870d88cc9b8ccf5355c9d7dca9e2f2d	dee.elise
cm8hrb1ik0001s60hh05ksq2i	andy.chimicles@shopify.com	andy.chimicles	https://www.gravatar.com/avatar/a0b5a744ef5dce208bb36ae2636db8a6	andy.chimicles
cm8hugbsc0000s60hs2rx0fwk	lucy.list@shopify.com	lucy.list	https://www.gravatar.com/avatar/797ff18ceb97c484a1d1f52a377210f3	lucy.list
cm8hv4w290000s60huatd0mjt	corey.margulis@shopify.com	corey.margulis	https://www.gravatar.com/avatar/cf756beba985c77d25e620c506950a52	corey.margulis
cmebv2it7000os60hrhlrqmb0	mike.crawford@shopify.com	mike.crawford	https://www.gravatar.com/avatar/4fc3810b1709083ccce0202388cb787c	mike.crawford
cm8hwdx8w0000s60hxeim74xo	amanda.spilchen@shopify.com	amanda.spilchen	https://www.gravatar.com/avatar/4c23b504ede447c2230fdcfdf4181847	amanda.spilchen
cm8i626m50000s60h9g930m5z	jess.clark@shopify.com	jess.clark	https://www.gravatar.com/avatar/68506799477604e82c90df9c073003a0	jess.clark
cm8ei2u30000is60hxldwf8tc	ryan.stone@shopify.com	ryan.stone	https://www.gravatar.com/avatar/85cb20fe31ce2f2494dd992f655a6f88	ryan.stone
cm8itflz10000s60hcyxzwalk	maria.soares@shopify.com	maria.soares	https://www.gravatar.com/avatar/6bbd726dd9f9be6b06f13d1b25f7daa9	maria.soares
cm8itld430001s60hr92oud67	carolyn.mcneillie@shopify.com	carolyn.mcneillie	https://www.gravatar.com/avatar/e953e33b84d59947cfaaa05f7b890868	carolyn.mcneillie
cm8itogbv0002s60hywdiwt84	jon.sudarkasa@shopify.com	jon.sudarkasa	https://www.gravatar.com/avatar/1b1a936c16d40ad2422a82560c87c3e4	jon.sudarkasa
cm8iuzb3n0005s60hnmme2v1y	emily.brouillet@shopify.com	emily.brouillet	https://www.gravatar.com/avatar/6e5cde63fecb6f45141361bc95c28dc5	emily.brouillet
cm8iv1f4o0006s60hbu5l5lhs	tony.hancock@shopify.com	tony.hancock	https://www.gravatar.com/avatar/e7b5946c1a31424c95f0ea91783eb1dd	tony.hancock
cm8ivgrng000gs60hkctfinsz	brandon.hopkins@shopify.com	brandon.hopkins	https://www.gravatar.com/avatar/9dbb95377bd0aee676293bad197fe2a4	brandon.hopkins
cm8ivmfr6000hs60hyxbbmkr2	justin.h.kim@shopify.com	justin.h.kim	https://www.gravatar.com/avatar/ec33a27ac82c3df7020478cc7ee222e2	justin.h.kim
cm8ivy2q7000is60hfk1iqbai	krystal.campioni@shopify.com	krystal.campioni	https://www.gravatar.com/avatar/cc2be30d9a4947413a8d2d43a29be732	krystal.campioni
cm8iw20xz000os60hacrl5vxq	katia.wheeler@shopify.com	katia.wheeler	https://www.gravatar.com/avatar/528d3809d6b883f6786d8937fa534b98	katia.wheeler
cm8iwo4kb001cs60h29fyt6k7	emanuele.pagani@shopify.com	emanuele.pagani	https://www.gravatar.com/avatar/09f8224591bd4246859e0e4a092c06c3	emanuele.pagani
cm8ixki5m001ds60hnxworbap	jacinthe.ricard@shopify.com	jacinthe.ricard	https://www.gravatar.com/avatar/db42c1ac638dfc3dfff86e115bcfd524	jacinthe.ricard
cm8ixpljw001es60hqdbihh7p	anja.nikolic@shopify.com	anja.nikolic	https://www.gravatar.com/avatar/dfd9ceac78f53cd2f0208a6629aaddba	anja.nikolic
cm8ixpzf9001fs60ho7quys1b	simon.bolduc@shopify.com	simon.bolduc	https://www.gravatar.com/avatar/2fedf0ec11cad0e1091dc976aea51004	simon.bolduc
cm8ixqrvy001gs60hv8xcps88	sarah.leviseur@shopify.com	sarah.leviseur	https://www.gravatar.com/avatar/bc6bf99b51774bf8109bab69794b927c	sarah.leviseur
cm8ixxqb7001hs60hq72z6ncd	steven.janczy@shopify.com	steven.janczy	https://www.gravatar.com/avatar/8156d99ff4eb75cbb92c4ca2ea0995fb	steven.janczy
cm8iz5826001ks60hfm8zynqb	taha.sheikh@shopify.com	taha.sheikh	https://www.gravatar.com/avatar/35a76f37752cf0096eb4f6a4ac10bacc	taha.sheikh
cm8izby50001ls60hxjw3r3r3	chelsea.clark@shopify.com	chelsea.clark	https://www.gravatar.com/avatar/2a9f18895ff5785dd689f4a806f17a9c	chelsea.clark
cm8erl7u80003s60hebi0qrx1	greg.becker@shopify.com	Greg Becker	https://www.gravatar.com/avatar/74c1d5c0def23c382790022ced6166e2	greg.becker
cm8j0qlds001rs60hy6k9txuj	mia.huang@shopify.com	mia.huang	https://www.gravatar.com/avatar/260020b66f2686369e699682a8daadf3	mia.huang
cm8j1nabq001ss60hizypzotf	kaz.nejatian@shopify.com	kaz.nejatian	https://www.gravatar.com/avatar/eb7b976ac19df66874536384f3026503	kaz.nejatian
cm8j3b3je001vs60h1s728b28	nikki.stephens@shopify.com	nikki.stephens	https://www.gravatar.com/avatar/a7ab7c9756ee4759c11bf07aeb64c098	nikki.stephens
cm8j40n2m001ws60hlh8miomw	mauricio.sierra@shopify.com	mauricio.sierra	https://www.gravatar.com/avatar/896d778c1692250c1377634a1eab0104	mauricio.sierra
cm8ja4w3o0023s60hbt09e04b	yvonne.geng@shopify.com	yvonne.geng	https://www.gravatar.com/avatar/2d5ea73793767ceb3ec7452c8dadb191	yvonne.geng
cm8jbb0hh0026s60h8936vqds	emily.curry@shopify.com	emily.curry	https://www.gravatar.com/avatar/36e42b1cb52cf1b5e9becd6bf9231713	emily.curry
cm8jprty60000s60hux5kj7gi	karen.maraj@shopify.com	karen.maraj	https://www.gravatar.com/avatar/2e81e0037e77a2ab73f12d1c3ccfca2a	karen.maraj
cm8k6cdi20000s60h99r4ykam	bjorn.dawson@shopify.com	bjorn.dawson	https://www.gravatar.com/avatar/ec619e0e6effcf4f5e2c4b9ee78c8c5f	bjorn.dawson
cm8kr50mh0000s60h1939hv9z	duncan.davidson@shopify.com	duncan.davidson	https://www.gravatar.com/avatar/e33edbd2653fdc4445043c065a2a50c2	duncan.davidson
cm8lpbgyb0000s60h5bevenyb	tanya.murray@shopify.com	tanya.murray	https://www.gravatar.com/avatar/cb58e0a55ed911a6d7368c3410384ea6	tanya.murray
cm8mc01c10000s60hv3zq1so7	eric.wichman@shopify.com	eric.wichman	https://www.gravatar.com/avatar/b89e9bf21465995a19fbabf2b5cc3405	eric.wichman
cm8mhb4z20000s60hzgrwly6b	neil.anderson@shopify.com	neil.anderson	https://www.gravatar.com/avatar/30a049cdff67ef8d66ed8337210e25e0	neil.anderson
cm8n234we0000s60hh5or4yqo	brennan@shopify.com	brennan	https://www.gravatar.com/avatar/0b77c037f609aedb5be1661739858c3d	brennan
cm8n3ir5c0000s60hhe1kilyv	helen.tsvirinkal@shopify.com	helen.tsvirinkal	https://www.gravatar.com/avatar/57681f6581133f1e34c2829a13ec44d6	helen.tsvirinkal
cm8n6hq410007s60h9j7ivkby	javan.wang@shopify.com	javan.wang	https://www.gravatar.com/avatar/9600d9fd62233f71bc19ec844dd6b6f4	javan.wang
cm8n7ftfl0008s60h35hy1x1f	reda.elmekabaty@shopify.com	reda.elmekabaty	https://www.gravatar.com/avatar/2697abf1b49aa7b54b20ce5de584ac0a	reda.elmekabaty
cm8n8kiad0000s60h7ggrvuen	reuben.sutton@shopify.com	reuben.sutton	https://www.gravatar.com/avatar/b714005b1f5f7ccb005b3748574cbd25	reuben.sutton
cm8n8zorv0003s60hdy6lixz3	maggie.tran@shopify.com	maggie.tran	https://www.gravatar.com/avatar/d6d3ad44965afb7ebeedbfac1c23daef	maggie.tran
cm8na98930004s60hdz750cnc	gemma.curl@shopify.com	gemma.curl	https://www.gravatar.com/avatar/185ee076e7ea41cde44ce499a005d51b	gemma.curl
cm8nd95li0000s60hozque6ko	kevin.crace@shopify.com	kevin.crace	https://www.gravatar.com/avatar/dd62ac2e6d4138caf8dee3af34ae66b6	kevin.crace
cm8nd98900001s60hd9kbkl2d	youmi.choi@shopify.com	youmi.choi	https://www.gravatar.com/avatar/1026ab010ae4b634def3086114048bb5	youmi.choi
cm8ndb89b0002s60hlqmowzqh	matt.meurer@shopify.com	matt.meurer	https://www.gravatar.com/avatar/4e77e268cdac34ff26846555cea8ef29	matt.meurer
cm8ndcbs80003s60hxb80e6tc	charlotte.poon@shopify.com	charlotte.poon	https://www.gravatar.com/avatar/0ea1f1ca139d170101b35015b39ab28b	charlotte.poon
cm8nddqq20004s60hrpowzwtd	michael.whitham@shopify.com	michael.whitham	https://www.gravatar.com/avatar/87e09c034cfa27a7ff5c2e2cf9033f01	michael.whitham
cm8ndjipc0005s60hyi91oxh5	russell.baylis@shopify.com	russell.baylis	https://www.gravatar.com/avatar/ac245d58eea288274c02f5f02e1c21f1	russell.baylis
cm8ndjwmh0006s60h0kvlebbj	aleks.polakowska@shopify.com	aleks.polakowska	https://www.gravatar.com/avatar/6998353d1392589b14c5800a6bc6db38	aleks.polakowska
cm8ndkper0007s60hdims4lup	kristen.fisher@shopify.com	kristen.fisher	https://www.gravatar.com/avatar/24a78b3e1194e13518d998b04dc65546	kristen.fisher
cm8ndr8260008s60h1dcvija0	nupur.mukherjee@shopify.com	nupur.mukherjee	https://www.gravatar.com/avatar/9ab85f8c9f0848f14684ec2cd0707773	nupur.mukherjee
cm8ndvc1e0009s60hd2s0mvn7	kei.huynh@shopify.com	kei.huynh	https://www.gravatar.com/avatar/23c317bc525c947cbf7c87489d868e78	kei.huynh
cm8nfbsvx000as60h6ixu0t3n	bill.devine@shopify.com	bill.devine	https://www.gravatar.com/avatar/97854631221f4d795fc032c0e3fd569e	bill.devine
cm8nhe4xl000bs60h9j3bmvm0	louise.heng@shopify.com	louise.heng	https://www.gravatar.com/avatar/265f9dffe1e1b105ce9cc32dfaf91440	louise.heng
cm8nht8y4000cs60ht7vq6rja	justin.close@shopify.com	justin.close	https://www.gravatar.com/avatar/2238e746aab14b97752bba04375b7a83	justin.close
cm8njbouk000ms60hy3w1ambv	marissa.godwin@shopify.com	marissa.godwin	https://www.gravatar.com/avatar/99527baa9d51d1195bd2a83549266f84	marissa.godwin
cm8njjgx3000ns60hfgjcv2re	kyle.luck@shopify.com	kyle.luck	https://www.gravatar.com/avatar/9005c1138ec548903ec5552d54056592	kyle.luck
cm8njlq6k0000s60hujvx2kbg	nabeel.pervaiz@shopify.com	nabeel.pervaiz	https://www.gravatar.com/avatar/f7f7e8f0f3913c25639d64daf36f21fd	nabeel.pervaiz
cm8njyxfz0001s60he7u7qx91	eric.johnson@shopify.com	eric.johnson	https://www.gravatar.com/avatar/a0a4b5a3ce7e6ecc044cb18271f12058	eric.johnson
cm8nk5rtq0002s60harmh7mlq	anton.kolisnyk@shopify.com	anton.kolisnyk	https://www.gravatar.com/avatar/4da7292fc4a7ae1080640337662c43eb	anton.kolisnyk
cm8o9znkh0000s60hd5emhds8	jamie.halvorson@shopify.com	jamie.halvorson	https://www.gravatar.com/avatar/97875da7b4c7414728702e02fa22d7c2	jamie.halvorson
cm8odcab10000s60h6h545z8s	roel.decoene@shopify.com	roel.decoene	https://www.gravatar.com/avatar/6df8e5822728942ef60152301f79486c	roel.decoene
cm8odcupz0001s60hhk208c0k	mariusz.michalak@shopify.com	mariusz.michalak	https://www.gravatar.com/avatar/c0d30b9f334fb4e4d798674532eb5353	mariusz.michalak
cm8odg3qj0002s60hgewpl9wt	krzysztof.daniszewski@shopify.com	krzysztof.daniszewski	https://www.gravatar.com/avatar/b3fa0f6f06b001ffaa40c87ecb05fda0	krzysztof.daniszewski
cm8odmxux0003s60h8bi3crag	tomo.ridleysiegert@shopify.com	tomo.ridleysiegert	https://www.gravatar.com/avatar/ce0b87d718b4becfe502708576e8bd04	tomo.ridleysiegert
cm8odu3d50004s60h8o1qsqzh	aaron.schubert@shopify.com	aaron.schubert	https://www.gravatar.com/avatar/dc0007fe1a00defe987294dad510b0ee	aaron.schubert
cm8oe08kj0005s60hkil61xgg	kieran.mallon@shopify.com	kieran.mallon	https://www.gravatar.com/avatar/f9c981ebee065f1fc943ea5edb2575c1	kieran.mallon
cm8oe220h0006s60hydztdmnu	tom.spencer@shopify.com	tom.spencer	https://www.gravatar.com/avatar/fb8a716cb265f4292e0c892a34925fc0	tom.spencer
cm8oev6vw0007s60hyvrc7ell	carlos.rodriguezcontreras@shopify.com	carlos.rodriguezcontreras	https://www.gravatar.com/avatar/f3496e7cfaa9e4e509a3b2ebe04e3536	carlos.rodriguezcontreras
cm8oj7wf20000s60hx3gsm03n	alex.viau@shopify.com	alex.viau	https://www.gravatar.com/avatar/a6cc66804048e4685e15c04121acadcd	alex.viau
cm8ok0f7k0001s60hd2cmwhmj	nico.martinezphipps@shopify.com	nico.martinezphipps	https://www.gravatar.com/avatar/c6d5133653167c7a3ec774dfd9ae4025	nico.martinezphipps
cmebv3i29000ps60horo5t63a	trish.gillett@shopify.com	trish.gillett	https://www.gravatar.com/avatar/d86da5457de6a4fd3a6d8f26cb94bfe8	trish.gillett
cm8oli66z0005s60hee9a2ejd	owen.dodd@shopify.com	owen.dodd	https://www.gravatar.com/avatar/a8670c40bfa4c495674b231a87aedf71	owen.dodd
cm8omhg4j000is60hltwo4972	kjell.reigstad@shopify.com	kjell.reigstad	https://www.gravatar.com/avatar/ba766d627fa4263e187073f32e79ad23	kjell.reigstad
cm8omte71000js60h8ojwef7w	zoe.arrieta@shopify.com	zoe.arrieta	https://www.gravatar.com/avatar/58cf73f36be800a7ca357d2daa19370b	zoe.arrieta
cm8onbupz000qs60hq5d3mdiz	sabrina.majeed@shopify.com	sabrina.majeed	https://www.gravatar.com/avatar/5f4f640c73ef72b9715057878e28c4a0	sabrina.majeed
cm8ooe8n9000rs60hkzgp6gbh	shepard.wallace@shopify.com	shepard.wallace	https://www.gravatar.com/avatar/c534013184c2c999e7f84ac431c53e3b	shepard.wallace
cm8oout7h000ss60hf7p2d45b	jeff.kraemer@shopify.com	jeff.kraemer	https://www.gravatar.com/avatar/df0f8595112edbe40ef94195ddaa0a22	jeff.kraemer
cm8or5deb001bs60hsjg54hrx	bryce.coster@shopify.com	bryce.coster	https://www.gravatar.com/avatar/3933cba29ff2236666e7737d53f883b1	bryce.coster
cm8orc2dd001cs60hbng0f2tu	michelle.kelly@shopify.com	michelle.kelly	https://www.gravatar.com/avatar/199729a5df8453dc16cd5af2c93e38b9	michelle.kelly
cm8orjxgz001ds60hntvy8phs	theresa.zeng@shopify.com	theresa.zeng	https://www.gravatar.com/avatar/2686594b1d0b2bdc716b0bc076c0e054	theresa.zeng
cm8ose0yx001es60hhk8atx6o	josh.mantooth@shopify.com	josh.mantooth	https://www.gravatar.com/avatar/37177597cc56ad002be232a69e3d0e1c	josh.mantooth
cm8owoodl0000s60h3areg7cz	daniel.alonsogarcia@shopify.com	daniel.alonsogarcia	https://www.gravatar.com/avatar/96d2b76ad85d93e72f0ac57b23c5dafc	daniel.alonsogarcia
cm8oy4oen0008s60hfw4zmxwy	andrew.lauder@shopify.com	andrew.lauder	https://www.gravatar.com/avatar/254080997d52cf69f4b6a4868e07448e	andrew.lauder
cm8p1l5ar0000s60hymn4ipjd	ibrahim.hasan@shopify.com	ibrahim.hasan	https://www.gravatar.com/avatar/f0055cf8cf8b0a574712f93ff7025435	ibrahim.hasan
cm8pse5mn0000s60hyjrczgi5	igor.bertolino@shopify.com	igor.bertolino	https://www.gravatar.com/avatar/9e232e844de18313ecff8873783d1b66	igor.bertolino
cm8pus7re0000s60h23zkmd04	barry.mcgee@shopify.com	barry.mcgee	https://www.gravatar.com/avatar/bbfefda2a21d0c36bb2ab25e8f100cc1	barry.mcgee
cm8pyjens0000s60ha1yvd4zd	lindsay.stock@shopify.com	lindsay.stock	https://www.gravatar.com/avatar/41f89abb8b30d5df9d51c0d3dcbf4b3e	lindsay.stock
cm8pywdbz0001s60h9yteq3b8	scott.meadows@shopify.com	scott.meadows	https://www.gravatar.com/avatar/7c2ccba6a6d5df2961aff0175cc313f6	scott.meadows
cm8q2ot5j0005s60h4uc1j7ig	chris.schmicker@shopify.com	chris.schmicker	https://www.gravatar.com/avatar/c914bbd8389cfa5acf294cd811e1ced5	chris.schmicker
cm8q3ra5e0006s60hetpnlhei	quincy.korteking@shopify.com	quincy.korteking	https://www.gravatar.com/avatar/c9bddc1af563d03040fce185f8c7be14	quincy.korteking
cm8q5bb390000s60hhki14rbc	matt.schmidt@shopify.com	matt.schmidt	https://www.gravatar.com/avatar/ba9a8ec779130efb53c2b37353ad9a51	matt.schmidt
cm8q6u6gc0005s60hmviihgz2	justina.eng@shopify.com	justina.eng	https://www.gravatar.com/avatar/7a1740c993a85a0b731d94925fa18af9	justina.eng
cm8qc85gs0006s60hwairanf9	juliana.andrada@shopify.com	juliana.andrada	https://www.gravatar.com/avatar/80814977a27f313b24c1dd6bde4f820d	juliana.andrada
cm8qce8hi0007s60hfs05372y	khosrow.ebrahimpour@shopify.com	khosrow.ebrahimpour	https://www.gravatar.com/avatar/9c47979b4ddd86c2f4af479294318791	khosrow.ebrahimpour
cm8qcefjg0008s60h3skv1me5	jonathan.chu@shopify.com	jonathan.chu	https://www.gravatar.com/avatar/3aa450407646b7fea9d3c2a817e0a8f1	jonathan.chu
cm8qcekq30009s60hzxbm3sp6	nana.adupoku@shopify.com	nana.adupoku	https://www.gravatar.com/avatar/3e06e3d516e7d5876631d648bc81f1e6	nana.adupoku
cm8qcg4bf000as60hu506gu5y	pedro.dias@shopify.com	pedro.dias	https://www.gravatar.com/avatar/a23987d88e269263810b32aa71661c44	pedro.dias
cm8qcg6o1000bs60hkl0x5qaa	yash.kothari@shopify.com	yash.kothari	https://www.gravatar.com/avatar/40254713f4fe78392e3eb7c494b89a87	yash.kothari
cm8qcgsuo000cs60h12cy1h2b	francis.pelland@shopify.com	francis.pelland	https://www.gravatar.com/avatar/2a5e2daff1ee3ae56c9ba788e3323fad	francis.pelland
cm8qciv62000ds60haqnctlvp	bobby.nguyen@shopify.com	bobby.nguyen	https://www.gravatar.com/avatar/e1994ecff9b6db7905c274cc28f7693a	bobby.nguyen
cm8qcj120000es60hamzsh2fw	thomas.massinger@shopify.com	thomas.massinger	https://www.gravatar.com/avatar/e276429d0aba6d78a29312c36cf118e3	thomas.massinger
cm8qcjn5o000fs60hmiv4ng4n	breno.limadefreitas@shopify.com	breno.limadefreitas	https://www.gravatar.com/avatar/22d3bcfb97739060f63f3130061e06d0	breno.limadefreitas
cm8qcjtnt000gs60hfsi1lav8	shawn.stankevitsch@shopify.com	shawn.stankevitsch	https://www.gravatar.com/avatar/692fd131b74d1860f88b2ab0ffdfd07e	shawn.stankevitsch
cm8qcnfi8000hs60hvpgc89zr	tom.coleman@shopify.com	tom.coleman	https://www.gravatar.com/avatar/e3fb077137924f88f2fd15681b84805f	tom.coleman
cm8qcr0ps000is60hna8yba8h	sungjin.kim@shopify.com	sungjin.kim	https://www.gravatar.com/avatar/52441295afb00473a84348a874e490da	sungjin.kim
cm8qcrymn000js60h4dctkqe5	alexander.sirris@shopify.com	alexander.sirris	https://www.gravatar.com/avatar/72604ab3948be75c97eda314904cebb7	alexander.sirris
cm8qcsiz2000ks60hqrywq613	sam.obrien@shopify.com	sam.obrien	https://www.gravatar.com/avatar/1ae5d333c9165a15c6b0a582c5c83c15	sam.obrien
cm8qct6p9000ls60hy9xexz5b	bhavika.tekwani@shopify.com	bhavika.tekwani	https://www.gravatar.com/avatar/fc1f68ed3c911d620a4f96c1e801b9b9	bhavika.tekwani
cm8qcw58x000ms60h53nnrfkj	tatsuya.oiwa@shopify.com	tatsuya.oiwa	https://www.gravatar.com/avatar/f4af421a614fdf4584afd627b5eca7c9	tatsuya.oiwa
cm8qd115b000ns60h9zx03of8	alex.watt@shopify.com	alex.watt	https://www.gravatar.com/avatar/648c61e15af6e6f8257d8ab464ad01cb	alex.watt
cm8qd13ql000os60hjtwt9cf9	david.mariassy@shopify.com	david.mariassy	https://www.gravatar.com/avatar/bd7632d038f0b743543c5127800f7b2d	david.mariassy
cm8qd1vxm000ps60h62mqkol6	brian.edwards@shopify.com	brian.edwards	https://www.gravatar.com/avatar/cbb2c43b18df3416f57e3e69a87c667c	brian.edwards
cm8qd3b79000qs60h0zhx313r	julia.hogan@shopify.com	julia.hogan	https://www.gravatar.com/avatar/5c444dcd0d8a00599159e6b0ef74d219	julia.hogan
cm8qd3z6c000rs60hjzpmfkyg	eric.fung@shopify.com	eric.fung	https://www.gravatar.com/avatar/4f5304e9d984fa46083bb2e39ac2eb0a	eric.fung
cm8qd69tz000ss60homph8vew	mark.polivchuk@shopify.com	mark.polivchuk	https://www.gravatar.com/avatar/d7a3991828dafe95e5558953083f8dd1	mark.polivchuk
cm8qdab0c000ts60h383kmpa6	allison.sadler@shopify.com	allison.sadler	https://www.gravatar.com/avatar/06c4b77cafc82ab2e5d9a49e20c7b553	allison.sadler
cm8qdcsin000us60hbqu4n1c1	mel.vanlieshout@shopify.com	mel.vanlieshout	https://www.gravatar.com/avatar/dbc6483efcae4013f6504d9f38b02954	mel.vanlieshout
cm8qddatr000vs60htp0tsfwx	nahom.befekadu@shopify.com	nahom.befekadu	https://www.gravatar.com/avatar/fc50b28e2667a95d7d916a39a5ffc530	nahom.befekadu
cm8qdebfu000ws60h48sapt9c	jorge.nunezsiri@shopify.com	jorge.nunezsiri	https://www.gravatar.com/avatar/4fe29d1765f3fb1e1376266b6a22b1b5	jorge.nunezsiri
cm8qdhscl000xs60hqhkr8lx1	catherine.baily@shopify.com	catherine.baily	https://www.gravatar.com/avatar/22fb02c6d4ea987b2dbaff9b76f4f7f7	catherine.baily
cm8qdks3w000ys60humm7cfke	christine.jensen@shopify.com	christine.jensen	https://www.gravatar.com/avatar/a031466331e8845495f80646cbacf1e7	christine.jensen
cm8qdlcy7000zs60hz50cm5u4	tom.lowe@shopify.com	tom.lowe	https://www.gravatar.com/avatar/855c09b6c612ae605a97fcdeda298cd3	tom.lowe
cm8qdoyk00010s60h5ivhls4q	louis.cloutier@shopify.com	louis.cloutier	https://www.gravatar.com/avatar/bb57d5554cb2731b20065132d35a478c	louis.cloutier
cm8qds9260011s60huz9we69g	ray.l.liu@shopify.com	ray.l.liu	https://www.gravatar.com/avatar/0c426328028af94fc1249218a3d29f8a	ray.l.liu
cm8qdvvp50012s60hun0ztuj9	david.gabrieli@shopify.com	david.gabrieli	https://www.gravatar.com/avatar/5bf3f3e0eb220a55930c1a4a2e67af46	david.gabrieli
cm8qdw59v0013s60hc9bthapo	madhav.makkena@shopify.com	madhav.makkena	https://www.gravatar.com/avatar/eb039025caf38fa2014c2e24699dcd80	madhav.makkena
cm8qdw8eu0014s60hxwt2blvv	ben.wolfram@shopify.com	ben.wolfram	https://www.gravatar.com/avatar/705e0d280bdbd0cec3dcced98cc5c3f9	ben.wolfram
cm8qdxd7h0015s60hwn5hot5k	kyle.risley@shopify.com	kyle.risley	https://www.gravatar.com/avatar/c5a7daa6c099c052273e36189606bcaa	kyle.risley
cm8qdybnc0016s60h73g1ml36	joe.james@shopify.com	joe.james	https://www.gravatar.com/avatar/7ebc9cad64ebfc55e75fcf75abecd898	joe.james
cm8qdyua50017s60hbo3vqbxl	carl.granstrom@shopify.com	carl.granstrom	https://www.gravatar.com/avatar/a1fd47893e88f317a4ace9293e98fb3e	carl.granstrom
cm8qdyx7x0018s60h9ip0i3q7	sarah.speight@shopify.com	sarah.speight	https://www.gravatar.com/avatar/7acb7c563a5c225e075e1de212a7ef86	sarah.speight
cm8qdzljm0019s60h7ue1vf7w	katie.cameron@shopify.com	katie.cameron	https://www.gravatar.com/avatar/aef2f8f0fb3d2ce079f05100ea8fdf1c	katie.cameron
cm8qe02jk001as60h98qodbin	dan.robinson@shopify.com	dan.robinson	https://www.gravatar.com/avatar/b3464f6deebd32216f4dd8a9e2a0d654	dan.robinson
cm8qe274u001bs60haf52s713	samuel.beshara@shopify.com	samuel.beshara	https://www.gravatar.com/avatar/0d2788c36c0ae4df763aa37bc1490bec	samuel.beshara
cm8qe4ypo001cs60hf7wbu6u9	travis.lammiman@shopify.com	travis.lammiman	https://www.gravatar.com/avatar/693a8c2d531837df5cb3cb647e5928c0	travis.lammiman
cm8qe57pg001ds60hvec54swq	jackson.waggoner@shopify.com	jackson.waggoner	https://www.gravatar.com/avatar/cbcce461a7ce207f407f71d19d7d3d01	jackson.waggoner
cm8qe5bds001es60hd7ss9yxc	jason.hoos@shopify.com	jason.hoos	https://www.gravatar.com/avatar/1e009281053a104c17a56a894ba04ae4	jason.hoos
cm8qeacoh001fs60hrkwd3cac	william.keller@shopify.com	william.keller	https://www.gravatar.com/avatar/c1a142ba1534040e387589bcf4f4b908	william.keller
cm8qeb2rv001gs60h2r7enpa4	julia.chelaru@shopify.com	julia.chelaru	https://www.gravatar.com/avatar/54c0b06a96e8981cd3ffd8b945c2a0f4	julia.chelaru
cm8qee5sf001hs60h7oxwqirb	sandeep.sidhu@shopify.com	sandeep.sidhu	https://www.gravatar.com/avatar/506646b3aea794eb30248ea7fe41a89e	sandeep.sidhu
cm8qeep5g001is60hhlohwvdb	paul.stepnowsky@shopify.com	paul.stepnowsky	https://www.gravatar.com/avatar/ba52ccbe5dc8dd31b365c4936def82c4	paul.stepnowsky
cm8qeewu4001js60h4e2365sj	john.sime@shopify.com	john.sime	https://www.gravatar.com/avatar/8c24308e0a2158ed9fb8514bb4864e8e	john.sime
cm8qefhsc001ks60hxs1wfy2g	steve.semerko@shopify.com	steve.semerko	https://www.gravatar.com/avatar/61d3a22f9dc98b84d953194bbc6370dc	steve.semerko
cm8qegfp7001ls60hmox03mmw	ashley.gibson@shopify.com	ashley.gibson	https://www.gravatar.com/avatar/ae02dd1589c8e26a3541bb079a30edaa	ashley.gibson
cm8qehysi001ms60h1ecm50js	sam.brace@shopify.com	sam.brace	https://www.gravatar.com/avatar/7cca9d000533c11b13386065ee0e9163	sam.brace
cm8qel6vb001ns60h9x4q9g3u	renee.lopezricher@shopify.com	renee.lopezricher	https://www.gravatar.com/avatar/5161fb7087630444d7c0a8b187c6c2e8	renee.lopezricher
cm8qeljcp001os60hhoyb9uzj	diego.gilon@shopify.com	diego.gilon	https://www.gravatar.com/avatar/f3c6669b63e5a2bafeb7752d34e0a317	diego.gilon
cm8qemq9a001ps60ho68lqybu	sara.smithchapman@shopify.com	sara.smithchapman	https://www.gravatar.com/avatar/dc40ae53ec33707311db154b8426c56e	sara.smithchapman
cm8qeo1n3001qs60hgoduxlrg	rodrigo.saito@shopify.com	rodrigo.saito	https://www.gravatar.com/avatar/452889ee75ea903c602efcb00e999f09	rodrigo.saito
cm8qerkl1001rs60htbvlon4v	sam.lai@shopify.com	sam.lai	https://www.gravatar.com/avatar/df4457b329944eca833d6863ac7a2a01	sam.lai
cm8qetljo001ss60hi33jn4q2	sara.hoffman@shopify.com	sara.hoffman	https://www.gravatar.com/avatar/ee610974416489eac6721cae77a1db13	sara.hoffman
cm8qexwwn001ts60hr3hg0voe	lindsay.krzepkowski@shopify.com	lindsay.krzepkowski	https://www.gravatar.com/avatar/600d638dde12830ca028fb984c3d0344	lindsay.krzepkowski
cm8qezgof001us60hzks6ow9z	fabian.sabogal@shopify.com	fabian.sabogal	https://www.gravatar.com/avatar/d1de1a478cb90b2500e7045a448f6771	fabian.sabogal
cm8qf05m6001vs60hqe8mp5ap	jacob.steves@shopify.com	jacob.steves	https://www.gravatar.com/avatar/21740d6295dffb71dee930dd92c8d07a	jacob.steves
cm8qf1f1y001ws60hhzx6wrrh	jack.enders@shopify.com	jack.enders	https://www.gravatar.com/avatar/f4b1802920ee57d0a54f3c1e3ae8a563	jack.enders
cm8qf2ihg001xs60h52pf1ntd	matt.cameron@shopify.com	matt.cameron	https://www.gravatar.com/avatar/6a9fdf6a241db05d2d8a3fb86943c729	matt.cameron
cm8qf5zoq001ys60h0ioi22cc	arsh.ganda@shopify.com	arsh.ganda	https://www.gravatar.com/avatar/988f585fd148a989ad7ea75750d46913	arsh.ganda
cm8qf6iz5001zs60hrnhlf7au	zoe.towart@shopify.com	zoe.towart	https://www.gravatar.com/avatar/72b3366d1d08fd32580275f964ff8bda	zoe.towart
cm8qf8zsd0020s60h43kh3ls7	cindy.lau@shopify.com	cindy.lau	https://www.gravatar.com/avatar/4d086489c67ba674facd0c36a383473c	cindy.lau
cm8qfapud0021s60hjdi4mlki	justin.henricks@shopify.com	justin.henricks	https://www.gravatar.com/avatar/666121894f36849b3c0a9b7e350f4fd7	justin.henricks
cm8qfe2rm0022s60hg7nudye0	maurice.rice@shopify.com	maurice.rice	https://www.gravatar.com/avatar/18bbbc64c049bb7d73adaf4dd89ecb5f	maurice.rice
cm8qfg1hs0023s60h9b39qdb3	yvonne.dixon@shopify.com	Yvonne Dixon	https://www.gravatar.com/avatar/fa2911a11ca87c8055c3f1e153974880	yvonne.dixon
cm8qfhath0024s60h7ndel744	elissa.unrau@shopify.com	elissa.unrau	https://www.gravatar.com/avatar/bfcba4d63df7148bbc6f41f996bbfccc	elissa.unrau
cm8qfj6pm0025s60hmf6mahry	marina.alves@shopify.com	marina.alves	https://www.gravatar.com/avatar/90d39b2506afd899626772109fb5e8ab	marina.alves
cm8qfjhft0026s60hz4g2cjsn	eddie.cheung@shopify.com	eddie.cheung	https://www.gravatar.com/avatar/916e5ec3022eab3f98fa26c57286748a	eddie.cheung
cm8qfjivl0027s60h7srk0akd	rowena.foo@shopify.com	rowena.foo	https://www.gravatar.com/avatar/c39d8177d31b887e818b2473c8b48ef3	rowena.foo
cm8qfjnfa0028s60hkekc71op	derek.feher@shopify.com	derek.feher	https://www.gravatar.com/avatar/3295049e85d8824011e622a7fe6f11d2	derek.feher
cm8qfk0b20029s60homgjbpv9	jordan.pereira@shopify.com	jordan.pereira	https://www.gravatar.com/avatar/766f7235ae537ad5c2f8a6159007f68a	jordan.pereira
cm8qfmtd7002as60hmw5joi2x	elizabeth.kenyon@shopify.com	elizabeth.kenyon	https://www.gravatar.com/avatar/6b1263c3a1e2563b715d5dbef1e74590	elizabeth.kenyon
cm8qg7n13002bs60h4iq621nw	roman.baiocco@shopify.com	roman.baiocco	https://www.gravatar.com/avatar/ee53a92ef2f826ff8d7db64b4f2d11ae	roman.baiocco
cm8qg7q8a002cs60hzqnnf6n5	nathan.santora@shopify.com	nathan.santora	https://www.gravatar.com/avatar/f282dce36d9813cbe0d2b7f6176e778b	nathan.santora
cm8qg80s9002ds60hrkmvfs02	matt.noakes@shopify.com	matt.noakes	https://www.gravatar.com/avatar/e40a8554ba39e8405f6e7c5405e9f3d4	matt.noakes
cm8qgh2ot002es60htgvfzy7e	keith.dell@shopify.com	keith.dell	https://www.gravatar.com/avatar/b4b3d7840c42a0ebc991cd0ab6bb66eb	keith.dell
cm8qglok1002fs60hh3m5vnt1	pablo.rocco@shopify.com	pablo.rocco	https://www.gravatar.com/avatar/2892382a0cdd28f0ea23c89e3eab50e9	pablo.rocco
cm8qgoy10002gs60hb4nlnsqi	niko.rutherford@shopify.com	niko.rutherford	https://www.gravatar.com/avatar/e2ab42b96be78780941cd998e245b0f1	niko.rutherford
cm8qgv0xb002hs60hmohxztaj	brittany.halldorson@shopify.com	brittany.halldorson	https://www.gravatar.com/avatar/fe16ac77ef2f3da6fc31deea6b21fdf0	brittany.halldorson
cm8qh4cg2002is60h5ps3zrph	willyam.arcand@shopify.com	willyam.arcand	https://www.gravatar.com/avatar/cf0afddcf958939bdb368e4a0787af93	willyam.arcand
cm8qh6g1d002js60h0joig21f	abdulrahman.hamideh@shopify.com	abdulrahman.hamideh	https://www.gravatar.com/avatar/a9ff9eac31899c8de1a3b706eb2acb28	abdulrahman.hamideh
cm8qhfvhc002ks60h53u3fjfq	marie.bushnell@shopify.com	marie.bushnell	https://www.gravatar.com/avatar/9e1bd34fba87a6e734a184cd6aacdc97	marie.bushnell
cm8qhrxki002ls60hu2n6dso5	christopher.ko@shopify.com	christopher.ko	https://www.gravatar.com/avatar/4747bad1f2fa9ea78e2ebebca01f5254	christopher.ko
cm8qhvkmx002ms60hvru4cajg	tianna.fischer@shopify.com	tianna.fischer	https://www.gravatar.com/avatar/9a9bf2ba673be2e0741096bf20788009	tianna.fischer
cm8qhxq9l002ns60htsjuobk2	matthew.nelson@shopify.com	matthew.nelson	https://www.gravatar.com/avatar/91ee7954e9d5ad1df20ea20a0d3acaef	matthew.nelson
cm8qi226k002os60h6vkpxmiy	chris.wang@shopify.com	chris.wang	https://www.gravatar.com/avatar/b33a7735d12a1d7288c85c002bfc7f63	chris.wang
cm8qi23xj002ps60hkd38wjln	hussein.patni@shopify.com	hussein.patni	https://www.gravatar.com/avatar/5828140f8748d23090e3247d62354d8c	hussein.patni
cm8qi8g23002qs60homd01scr	melanie.zieba@shopify.com	melanie.zieba	https://www.gravatar.com/avatar/eca5e67ac7d851f09af4f18db83d5ab4	melanie.zieba
cm8qip0np002rs60h6i8c1hxn	surya.dutta@shopify.com	surya.dutta	https://www.gravatar.com/avatar/c12d444b2333600c30b4e602fc1c40e7	surya.dutta
cm8qjbu3o0000s60hs93wsv74	jane.maguire@shopify.com	jane.maguire	https://www.gravatar.com/avatar/29c666a462e700ebec5be33380c10b04	jane.maguire
cm8qjmzxn0001s60hf5r9bv7w	thomas.ward@shopify.com	thomas.ward	https://www.gravatar.com/avatar/f9f487725b570fd371529c23a07fc591	thomas.ward
cm8qjqofz0002s60hde2kx1af	shuhei.eda@shopify.com	shuhei.eda	https://www.gravatar.com/avatar/124abbe68a572809787730fc04b37061	shuhei.eda
cm8qk4s1q0003s60hjlq6ousz	stephen.falepau@shopify.com	stephen.falepau	https://www.gravatar.com/avatar/4c34013d3bbcd31f48137eae56e29119	stephen.falepau
cm8ql9ohq0000s60hxbno8h9c	john.garratt@shopify.com	john.garratt	https://www.gravatar.com/avatar/6de95ca46761e5b47dc54dc51c356acc	john.garratt
cm8qlfipy0004s60hm4gl3k1c	ash.charles@shopify.com	ash.charles	https://www.gravatar.com/avatar/117376f0f6d13621b4527c16c441e979	ash.charles
cm8qmmdcg0000s60hiw1gtw58	sherine.soliman@shopify.com	sherine.soliman	https://www.gravatar.com/avatar/e1a7a27cac0cb585123d84b61e443b06	sherine.soliman
cm8qmowb50001s60hdfqv2f4x	brian.glick@shopify.com	brian.glick	https://www.gravatar.com/avatar/ee0176caad19a0e13379809e94a9492d	brian.glick
cm8qn4c0r0002s60h7avphzl9	israel.fayode@shopify.com	israel.fayode	https://www.gravatar.com/avatar/4f120ced310f8c9e53571feee19f1a9e	israel.fayode
cm8qne9yc0003s60hpj7qtpmk	dan.menard@shopify.com	dan.menard	https://www.gravatar.com/avatar/ad2d19deb8db5876fa974aad84d45a9a	dan.menard
cm8qnqery0004s60hdfn1hfj2	eric.kogut@shopify.com	eric.kogut	https://www.gravatar.com/avatar/e3e9cebb118af2609b71760959662193	eric.kogut
cm8qnqhet0005s60hbyuvhz9u	rose.wiegley@shopify.com	rose.wiegley	https://www.gravatar.com/avatar/5228330f22b0e795ec6f538f4b1a8087	rose.wiegley
cm8qokujk0000s60hxuhh3xb3	shane.pope@shopify.com	shane.pope	https://www.gravatar.com/avatar/5b34b14cb8488a921b003778752058f7	shane.pope
cm8qolqlx0001s60habu86g0a	reuben.osborne@shopify.com	reuben.osborne	https://www.gravatar.com/avatar/42f7ff857ec50925c3bb14831cd1177b	reuben.osborne
cm8qowimx0002s60hembuk4o4	charlie.king@shopify.com	charlie.king	https://www.gravatar.com/avatar/0dc3bc36d846833fa7af1abec17f02cf	charlie.king
cm8qp74kg0005s60h5evwt24g	santos.gagbegnon@shopify.com	santos.gagbegnon	https://www.gravatar.com/avatar/d6124e9805c353939eca5f5b6933ac7b	santos.gagbegnon
cm8qp9ht10006s60hpr8hdtgd	leo.zhao@shopify.com	leo.zhao	https://www.gravatar.com/avatar/b417fa3e5cb97b332fd3a72579b304d5	leo.zhao
cm8qpwgyd0007s60hb1s61qeq	brendan.rygus@shopify.com	brendan.rygus	https://www.gravatar.com/avatar/8a3ce361a9b7d5babe0c5feeb969c835	brendan.rygus
cm8qr0qoh0000s60haj3kjs88	daniel.wyckoff@shopify.com	daniel.wyckoff	https://www.gravatar.com/avatar/092f66b8f5f07edca2ba9164a2e7791e	daniel.wyckoff
cm8qscun40000s60hk82dzfq1	thomas.edgesmith@shopify.com	thomas.edgesmith	https://www.gravatar.com/avatar/6c304aef183e13145caba1df1d1e1c90	thomas.edgesmith
cm8qsgj440001s60hjkhvom61	stewart.knapman@shopify.com	stewart.knapman	https://www.gravatar.com/avatar/6c24cb5e82f8372d603f48551646215e	stewart.knapman
cm8qswhgw0002s60hd3osxzn6	neelay.shah@shopify.com	neelay.shah	https://www.gravatar.com/avatar/e7d8f8ca3d156fe34eab6490ccc4827f	neelay.shah
cm8qsz7wj0003s60h8zxor8sx	ayush.bindal@shopify.com	ayush.bindal	https://www.gravatar.com/avatar/deb839d7d76033e9c901dc7178c3dbcc	ayush.bindal
cm8qw16d30000s60hn9o185jm	kenta.suzuki@shopify.com	kenta.suzuki	https://www.gravatar.com/avatar/e8be32366f88d0147e4eb68f26e2501e	kenta.suzuki
cm8qxcmey0000s60hwnhjh9sf	davina.bhatt@shopify.com	davina.bhatt	https://www.gravatar.com/avatar/a9a3071b3db2ad3ff372ac5a7bcff813	davina.bhatt
cm8qzqr5b0000s60h2wsnola2	tatiana.pustovetova@shopify.com	tatiana.pustovetova	https://www.gravatar.com/avatar/bbb9e4c9d7924c399bc038712c346f07	tatiana.pustovetova
cm8r0napz0000s60hixch8t2y	jose.alvarez@shopify.com	jose.alvarez	https://www.gravatar.com/avatar/753f4957ac891ebcf785241c8cdf80ed	jose.alvarez
cm8r12du90001s60h2eekaure	adam.traver@shopify.com	adam.traver	https://www.gravatar.com/avatar/baeffb8f8c32f4966dfd5efd2b1ad2df	adam.traver
cm8r1jvs70002s60h1c0m4w8i	adomas.budrys@shopify.com	adomas.budrys	https://www.gravatar.com/avatar/c622f1df3858d51353cf58cb759d2d7c	adomas.budrys
cm8r2n4350000s60hntanib32	gaetan.bzodek@shopify.com	gaetan.bzodek	https://www.gravatar.com/avatar/ae7718057cc5f9097dbfaa4395f925af	gaetan.bzodek
cm8r2xxu20001s60htgic3q7f	saffron.doporto@shopify.com	saffron.doporto	https://www.gravatar.com/avatar/4328d07131df92166290dd101f4e2d60	saffron.doporto
cm8r2z6no0002s60hfr17d9kh	krzysztof.semenowicz@shopify.com	krzysztof.semenowicz	https://www.gravatar.com/avatar/7ebf130ed01a8c7c7491421c078e88ec	krzysztof.semenowicz
cm8r3hywc0003s60htn6rlk0v	pat.conway@shopify.com	pat.conway	https://www.gravatar.com/avatar/9f7ce13f3d8717e6da7d65dcb7d1fcfd	pat.conway
cm8r40pxz0004s60hilfrvssd	maxence.haltel@shopify.com	maxence.haltel	https://www.gravatar.com/avatar/7de756aea4be8d44f3ab7c06b6845a93	maxence.haltel
cm8r4df8x0005s60hxry5mmkl	phil.messenger@shopify.com	phil.messenger	https://www.gravatar.com/avatar/7be35cc55e235a9ba57c6b2caa86bc94	phil.messenger
cm8r59wpw0006s60hca82ph6g	thomas.wija@shopify.com	thomas.wija	https://www.gravatar.com/avatar/0d9aeb3863b4256ef67770c41861a9a9	thomas.wija
cm8r5sld40007s60hi5l4jbgw	jin.xu@shopify.com	jin.xu	https://www.gravatar.com/avatar/ef926c48c91c9626410826f1cb305830	jin.xu
cm8r5x7rs0008s60h3tib511q	isaac.roldan@shopify.com	isaac.roldan	https://www.gravatar.com/avatar/22db9ea6fa525cea8d9022a22aaf95b3	isaac.roldan
cm8r6gaj50009s60hlsny9hr7	shaun.stanworth@shopify.com	shaun.stanworth	https://www.gravatar.com/avatar/59ab162f78553ba4c25e234c0ff00912	shaun.stanworth
cm8r6now9000as60hao7vrwel	uzair.shaikh@shopify.com	uzair.shaikh	https://www.gravatar.com/avatar/f9d9aeeb005f4322703a4273ceef5711	uzair.shaikh
cm8r6qoa4000bs60h8u4x3txy	jhoan.trujillo@shopify.com	jhoan.trujillo	https://www.gravatar.com/avatar/ab160627fbba5f1f92ba36632b8eb52a	jhoan.trujillo
cm8r7m2ov0000s60hps9uc8q3	joshua.bee@shopify.com	joshua.bee	https://www.gravatar.com/avatar/94e1948826a46b150a5fd9a4c843000e	joshua.bee
cm8r7sa0y0001s60h4vqd4haq	tadas.scerbinskas@shopify.com	tadas.scerbinskas	https://www.gravatar.com/avatar/fe689d7d4850eeed9f701f12b00bf60f	tadas.scerbinskas
cm8r7vrof0002s60hamaezzh2	simon.horsfield@shopify.com	simon.horsfield	https://www.gravatar.com/avatar/de030e9888f178020b59107917737f49	simon.horsfield
cm8r7wt9i0003s60hf51z3ncx	giorgos.logiotatidis@shopify.com	giorgos.logiotatidis	https://www.gravatar.com/avatar/6ea38743724e46d43f8a315e296e845b	giorgos.logiotatidis
cm8r8j9hf0004s60hg7qbdx8r	martin.barlow@shopify.com	martin.barlow	https://www.gravatar.com/avatar/79f90abca5aaaf69a33243981b30fbd2	martin.barlow
cm8r94lg50005s60he5iw5d11	brian.har@shopify.com	brian.har	https://www.gravatar.com/avatar/e40f312f345f31b4948767b182332666	brian.har
cm8r97ipr0006s60hlwuj0bzn	jennifer.tryon@shopify.com	jennifer.tryon	https://www.gravatar.com/avatar/e830bfeafe9a065b5957d4b8326ed5f8	jennifer.tryon
cm8r9cikn0007s60h3taj7zpl	darren.worrall@shopify.com	darren.worrall	https://www.gravatar.com/avatar/ec2965dd9ad22779c36e0bea83b8d19e	darren.worrall
cm8r9cvdd0008s60h0k5czpvf	stefan.magnuson@shopify.com	stefan.magnuson	https://www.gravatar.com/avatar/4461eb12f0c715b03b8ec015573445eb	stefan.magnuson
cm8r9fhnx0009s60hgx1ee5uk	edilson.correa@shopify.com	edilson.correa	https://www.gravatar.com/avatar/e5d32519a140ae79531ab365fdeef023	edilson.correa
cm8r9irqx000as60h03g3smgw	mita.sampat@shopify.com	mita.sampat	https://www.gravatar.com/avatar/b36bf9d655a1717be4bcd87cb1952ee5	mita.sampat
cm8r9n175000bs60hug20j5g1	ignacio.chiazzo@shopify.com	ignacio.chiazzo	https://www.gravatar.com/avatar/4b1160e7ea297a445805506064ca0366	ignacio.chiazzo
cm8r9t7kx000cs60hc1s30k2w	daniel.tierney@shopify.com	daniel.tierney	https://www.gravatar.com/avatar/bdae4c7e80804e15476e11bb1eb3a4e7	daniel.tierney
cm8r9viib000ds60h41cerosd	noelle.quigley@shopify.com	noelle.quigley	https://www.gravatar.com/avatar/8a4606f701437770f1561a8f5f1781c9	noelle.quigley
cm8ra564g000es60h8zcdogsc	marcin.gajewski@shopify.com	marcin.gajewski	https://www.gravatar.com/avatar/c59bb5663cd2d3c44c0ba19cce27f364	marcin.gajewski
cm8ra7ye5000fs60hmxtqsj1t	marcelo.mottalli@shopify.com	marcelo.mottalli	https://www.gravatar.com/avatar/5e2c6d2cdc3c12b66b0be72da94ab381	marcelo.mottalli
cm8ram1sl000gs60ho9ufoyka	ryan.griffin@shopify.com	ryan.griffin	https://www.gravatar.com/avatar/49cd8a26dbb4236b7a1a3e2acb898bdc	ryan.griffin
cm8rb0r95000hs60hdcmp0vb2	jamie.ly@shopify.com	jamie.ly	https://www.gravatar.com/avatar/4c9096bf66b19c668357867815be0df3	jamie.ly
cm8rbo7vi0000s60hadafqyj7	aly.andrews@shopify.com	aly.andrews	https://www.gravatar.com/avatar/3bd80960550b7eb2d80a083dafaf3fec	aly.andrews
cm8rbshp40001s60hvzivifrf	derek.redmond@shopify.com	derek.redmond	https://www.gravatar.com/avatar/84a4d1d98af8ad2245004ff8425a4f52	derek.redmond
cm8rbsqgz0002s60h8uwpkrxr	dylan.gray@shopify.com	dylan.gray	https://www.gravatar.com/avatar/5f0e7fa4c0cdfadc78bc985d6afefb72	dylan.gray
cm8rbus090003s60hwrhzv8vi	cristina.smiarowski@shopify.com	cristina.smiarowski	https://www.gravatar.com/avatar/576ff8481ee0802e80960db76b60667f	cristina.smiarowski
cm8rbzgo60004s60hgd4gn4tz	allie.speers@shopify.com	allie.speers	https://www.gravatar.com/avatar/131814bfec5539bceb43d5d2f88e818c	allie.speers
cm8rc3dlq0005s60hx96byukf	pedro.cantarelli@shopify.com	pedro.cantarelli	https://www.gravatar.com/avatar/beeba3d723f14c4184bdd395c40ee9d2	pedro.cantarelli
cm8rcuz9e0006s60htvyfxyvd	mangeshi.gireesh@shopify.com	mangeshi.gireesh	https://www.gravatar.com/avatar/527b24d2f6855e648143b238db525391	mangeshi.gireesh
cm8rcvqg60007s60h5de0x9hf	drew.hayward@shopify.com	drew.hayward	https://www.gravatar.com/avatar/e672f19b95a82b889985fa5fcf5663c6	drew.hayward
cm8rd3fym0008s60hbncspzgr	mico.javier@shopify.com	mico.javier	https://www.gravatar.com/avatar/44e29dcc96a73ce57307482c2893941f	mico.javier
cm8rd7p8u0009s60hudnh4jcy	greg.clarke@shopify.com	greg.clarke	https://www.gravatar.com/avatar/a3435be60efd7bdcec5c5eee04e93895	greg.clarke
cm8rdcyma000as60hbj9dzdbz	monika.dirzinauskyte@shopify.com	monika.dirzinauskyte	https://www.gravatar.com/avatar/72b33a17d2337617f860ebbf16224d8f	monika.dirzinauskyte
cm8rdgos7000bs60h3kclhs8e	valerie.raese@shopify.com	valerie.raese	https://www.gravatar.com/avatar/23928049541861ee5f6e0c85b81d8437	valerie.raese
cm8rdr872000cs60hl25t9tfh	ashvin.rajasiri@shopify.com	ashvin.rajasiri	https://www.gravatar.com/avatar/ba5c7d9ad4467feb8b8c91441a2ac211	ashvin.rajasiri
cm8rdtt4t000ds60hr1jio99u	gregoire.weber@shopify.com	gregoire.weber	https://www.gravatar.com/avatar/c93c44c3314948501041afd27ffac253	gregoire.weber
cm8rdwk5h000es60h8jpd9zu8	vinicius.stock@shopify.com	vinicius.stock	https://www.gravatar.com/avatar/63a02648b33347d954c02cbfa9da4c5d	vinicius.stock
cm8re56os000fs60hof53cu5m	yad.dhaliwal@shopify.com	yad.dhaliwal	https://www.gravatar.com/avatar/17ee8d8ca711a1afc4ed92023b83e2ee	yad.dhaliwal
cm8rebvll000gs60ho3eljgpv	mira.elhussein@shopify.com	mira.elhussein	https://www.gravatar.com/avatar/39bdb5e68a88214699e0fe8aba5b3824	mira.elhussein
cm8redk74000hs60heoezgzku	sam.schmidt@shopify.com	sam.schmidt	https://www.gravatar.com/avatar/81f5ec31df2fb64fc4b0634ac3294e5e	sam.schmidt
cm8remqyu000is60hnjkwh4ra	christopher.munro@shopify.com	christopher.munro	https://www.gravatar.com/avatar/c675c918673f7d299e5f40fd69bf7f38	christopher.munro
cm8reorud000js60h0z2eo3ve	sarah.burda@shopify.com	sarah.burda	https://www.gravatar.com/avatar/6603374dad354392b13738e54dc58124	sarah.burda
cm8reqnvm000ks60hdw5rcxtf	khalaf.mohamed@shopify.com	khalaf.mohamed	https://www.gravatar.com/avatar/e4aa507b8cce7d0237b08ecc816ffed1	khalaf.mohamed
cm8reus8v000ls60hnxfnsohq	alycia.holyk@shopify.com	alycia.holyk	https://www.gravatar.com/avatar/20ffe48e6241b0d04175506b001978eb	alycia.holyk
cm8rey176000ms60hzv1uj7rn	nomar.abdullah@shopify.com	nomar.abdullah	https://www.gravatar.com/avatar/7e773403aba9bbd0750de492e5ae17e7	nomar.abdullah
cm8rf02et000ns60hbwhzuj46	arun.dhanda@shopify.com	arun.dhanda	https://www.gravatar.com/avatar/f84552917068ae4a1542c73b85d44af3	arun.dhanda
cm8rfameu000os60hk7951a0l	virak.ngauv@shopify.com	virak.ngauv	https://www.gravatar.com/avatar/52a11dc1dc1bb8055a7efed48409a83f	virak.ngauv
cm8rfeq3x000ps60h3kn5pivq	aashna.narang@shopify.com	aashna.narang	https://www.gravatar.com/avatar/1e149c25a47819a80065885900d2e3b5	aashna.narang
cm8rfeulq000qs60hx2vpsje2	tyler.cosgrove@shopify.com	tyler.cosgrove	https://www.gravatar.com/avatar/67978457cb573aff0832ac7ab06adc1d	tyler.cosgrove
cm8rfizxi000rs60hnu9vwxfv	nick.silverman@shopify.com	nick.silverman	https://www.gravatar.com/avatar/421bb714f01fa5eeb2d596e3bb87a63d	nick.silverman
cm8rfv52l000ss60heuwmtllp	anthony.frehner@shopify.com	anthony.frehner	https://www.gravatar.com/avatar/82cd191f4b561c1c1f9db9acb6b4fc47	anthony.frehner
cm8rfvgrk000ts60hcntgofod	harley.balabanian@shopify.com	harley.balabanian	https://www.gravatar.com/avatar/421f18dd45662ab724de1c47f0e46be7	harley.balabanian
cm8rfvxj4000us60hus86lvej	anshul.goyal@shopify.com	anshul.goyal	https://www.gravatar.com/avatar/3afc7dc87b508ebec9e701dcd47b1c7f	anshul.goyal
cm8rg0a27000vs60hzl03odq4	jan.napenas@shopify.com	jan.napenas	https://www.gravatar.com/avatar/66232bd4e6b32c4b5b8451f599f052e2	jan.napenas
cm8rg4m2s000ws60hct5ptm2f	vitor.correa@shopify.com	vitor.correa	https://www.gravatar.com/avatar/9d50f77ee3c4fe95551f4a9236b19681	vitor.correa
cm8rg8iqw000xs60hp73sbkei	ian.dyck@shopify.com	ian.dyck	https://www.gravatar.com/avatar/36ef5808b073decdd14b45dc5f05abc9	ian.dyck
cm8rgafgn000ys60h0uohox2w	maria.weaver@shopify.com	maria.weaver	https://www.gravatar.com/avatar/5fcaa92eac1e18db05d3e7550204ac42	maria.weaver
cm8rgeqha000zs60hmgmz1vw9	alex.djordjevic@shopify.com	alex.djordjevic	https://www.gravatar.com/avatar/0a1df67a337be6986a77a2e5b40a2948	alex.djordjevic
cm8rgjteq0010s60hhyxrkgjw	nick.taylor@shopify.com	nick.taylor	https://www.gravatar.com/avatar/b0366c46735ead63b2350545235fc45e	nick.taylor
cm8rgno8h0011s60h9nva9mq1	david.sheerin@shopify.com	david.sheerin	https://www.gravatar.com/avatar/2a03d9536eaff05b3ca43e7fa74b97c8	david.sheerin
cm8rgomn30012s60hh9fwcjv5	alex.montague@shopify.com	alex.montague	https://www.gravatar.com/avatar/3da43153c44a41928ed499da85726158	alex.montague
cm8rgvzcw0013s60hicdv9ino	jennifer.lam@shopify.com	jennifer.lam	https://www.gravatar.com/avatar/d866ea328d405d8c691000364648aa6e	jennifer.lam
cm8rgxtiw0014s60htntpke6x	max.stoiber@shopify.com	max.stoiber	https://www.gravatar.com/avatar/f10ef3e490ad045accdc4b2e2bb33a66	max.stoiber
cm8rh0p2v0015s60hhdjq3j3z	matthew.sherar@shopify.com	matthew.sherar	https://www.gravatar.com/avatar/c9c70aafe283b753fb7dac172f5c1059	matthew.sherar
cm8rh1i2u0016s60h40wrwfbb	cindy.girard@shopify.com	cindy.girard	https://www.gravatar.com/avatar/a6103f62d8763dab988b656bff296a97	cindy.girard
cm8rh3jlc0017s60hco7971vo	alex.chinn@shopify.com	alex.chinn	https://www.gravatar.com/avatar/a38b6864c01f0ed28b11c98b12abe51f	alex.chinn
cm8rh7b0f0018s60hozmynn9g	dianing.yudono@shopify.com	dianing.yudono	https://www.gravatar.com/avatar/47448165bd161dc5aa3408d0884a0bf5	dianing.yudono
cm8rh85450019s60hz7axk7wh	victor.r.vuong@shopify.com	victor.r.vuong	https://www.gravatar.com/avatar/7a5144ee442f9a367c53a7f88a9b7a55	victor.r.vuong
cm8rhek7o001as60hzogefgik	katie.brioux@shopify.com	katie.brioux	https://www.gravatar.com/avatar/a3a833ebea220112b422264ef49c545d	katie.brioux
cm8rhhoj3001bs60hrjwc0t75	jeffrey.wood@shopify.com	jeffrey.wood	https://www.gravatar.com/avatar/829ea999300a772af44741c1fbe41e2b	jeffrey.wood
cm8rhimao001cs60hcvhxpoga	adrian.prayogo@shopify.com	adrian.prayogo	https://www.gravatar.com/avatar/f4e5bf310b024762775cff100b853955	adrian.prayogo
cm8rhktvw001ds60hokky43y5	mathyas.papp@shopify.com	mathyas.papp	https://www.gravatar.com/avatar/06d6faffbb64b08e2a72bab6cde2680c	mathyas.papp
cm8rhlmmd001es60h73mmrf5j	damion.rashford@shopify.com	damion.rashford	https://www.gravatar.com/avatar/48a954fd64b59dadb7f30a7afaa70aa4	damion.rashford
cm8rhn43e001fs60hw3871y43	brina.seidel@shopify.com	brina.seidel	https://www.gravatar.com/avatar/8bc223813879599303e34689df0e30d9	brina.seidel
cm8rht3fu001gs60hm3foyrr0	alex.coco@shopify.com	alex.coco	https://www.gravatar.com/avatar/4bdb3280f15cfe4f540b487f3e37734c	alex.coco
cm8ri2hkr001hs60hvmv6lz1x	jennifer.chase@shopify.com	jennifer.chase	https://www.gravatar.com/avatar/83819f927be274efdd1167298cfcf68d	jennifer.chase
cm8ri9q8q001is60h5vzh80vx	nicolas.liu@shopify.com	nicolas.liu	https://www.gravatar.com/avatar/22fec961b6646a7b094788b638021c52	nicolas.liu
cm8ridj3d001js60htu1ciibk	aadi.sanghani@shopify.com	aadi.sanghani	https://www.gravatar.com/avatar/5ef65efe8b48e83afb816eab9f38f0cc	aadi.sanghani
cm8riojvn001ks60hs25equms	sunitha.patel@shopify.com	sunitha.patel	https://www.gravatar.com/avatar/8c5ce7bc4ce8ddcb21f9ba5cb289ef79	sunitha.patel
cm8riqh46001os60ht3uci6u8	james.lepp@shopify.com	james.lepp	https://www.gravatar.com/avatar/d8a6c57eb8bd537a8b3791d598b85916	james.lepp
cm8rj5qjt001ss60h3m2gofv7	ryan.musgrave@shopify.com	ryan.musgrave	https://www.gravatar.com/avatar/bce73318f1ddb3638d1e236118e5d065	ryan.musgrave
cm8rj9yq8001ts60hc05ahby4	victor.zhao@shopify.com	victor.zhao	https://www.gravatar.com/avatar/997f18142e2ba5f72cb64091ba3d4d80	victor.zhao
cm8rjgait001us60hls9hvw7u	loren.blackman@shopify.com	loren.blackman	https://www.gravatar.com/avatar/2304ea9e1cac5f8a348117657f6ce161	loren.blackman
cm8rjrpzh001vs60hsq067xbz	jeremy.smereka@shopify.com	jeremy.smereka	https://www.gravatar.com/avatar/0ccbc34f800f20b4abbc34304c941a58	jeremy.smereka
cm8rjx1pp001zs60h1zfo2h0r	jiabo.hou@shopify.com	jiabo.hou	https://www.gravatar.com/avatar/fb115e2801da3f84029745f7cc09dbd7	jiabo.hou
cm8rk67wc0020s60holrarhem	carter.daly@shopify.com	carter.daly	https://www.gravatar.com/avatar/b42b0592090f2dde1a5a57af39940e9e	carter.daly
cm8rk7djh0021s60h6k8m0nvp	venkat.iyer@shopify.com	venkat.iyer	https://www.gravatar.com/avatar/49f77e279335f5eb5091170a1554f207	venkat.iyer
cm8rko0o80028s60hpuqaw3th	haroon.ahmed@shopify.com	haroon.ahmed	https://www.gravatar.com/avatar/b3d6b4e03245bd4eeddc14bcfb7f2ee9	haroon.ahmed
cm8rkucvh0029s60hd7555q8o	thomas.geselle@shopify.com	thomas.geselle	https://www.gravatar.com/avatar/e68230bd2278f41a4b7daab012fafe1a	thomas.geselle
cm8rl6y4e002as60hj96i4kcy	kristin.arruda@shopify.com	kristin.arruda	https://www.gravatar.com/avatar/371791a502d28cd8fc814d8d82c271a1	kristin.arruda
cm8rl754i002bs60hn827ywq4	colton.powell@shopify.com	colton.powell	https://www.gravatar.com/avatar/92976f97bcf59cd7a4ba66046fe50f45	colton.powell
cm8rlakxz002cs60hccushqgl	kurt.gooden@shopify.com	kurt.gooden	https://www.gravatar.com/avatar/98dbb1a6e5fa40fe84ec68590e2b3b86	kurt.gooden
cm8rlccrh002ds60hg4a2ebpf	malia.dupuis@shopify.com	malia.dupuis	https://www.gravatar.com/avatar/e0ef52a4fd11c7efd6c34be90fcf3917	malia.dupuis
cm8rlpbcm002es60h7017pqdp	jason.godson@shopify.com	jason.godson	https://www.gravatar.com/avatar/d1996c884b9887fdf779e1b3bd2022f6	jason.godson
cm8rlsld1002fs60hh9oa29p9	raquelle.yohanna@shopify.com	raquelle.yohanna	https://www.gravatar.com/avatar/611f461c9ce5a57bc10f359ff31c9456	raquelle.yohanna
cm8rlv0iv002gs60h1xn4xptp	paiman.parmaei@shopify.com	paiman.parmaei	https://www.gravatar.com/avatar/c200f8218fe3957ca1143528dedd783e	paiman.parmaei
cm8rm8vuu002hs60hdv0pda2r	cody.stevens@shopify.com	cody.stevens	https://www.gravatar.com/avatar/e320213a0e5fadc84ce1028cf48408fa	cody.stevens
cm8rmagn4002is60h2w7dcref	liam.meade@shopify.com	liam.meade	https://www.gravatar.com/avatar/af7ebf21df81fd7bee81e99d71eac330	liam.meade
cm8rmnv08002js60h5liocwb4	kris.zawadka@shopify.com	kris.zawadka	https://www.gravatar.com/avatar/b2a853a07b683b54ff4debaed4be754a	kris.zawadka
cm8rne5vi002ks60h66uvzp4s	scott.newson@shopify.com	scott.newson	https://www.gravatar.com/avatar/639705125314d510d61d8093a5786aad	scott.newson
cm8rnekxa002ls60hd8bukmqp	greg.craft@shopify.com	greg.craft	https://www.gravatar.com/avatar/9acb9752cd84a88658d88d49d1ae63d5	greg.craft
cm8rnexc7002ms60h9mim5vsv	jay.dave@shopify.com	jay.dave	https://www.gravatar.com/avatar/688de0fc7f12e9d905a87ebee6f04295	jay.dave
cm8rnwfbu002ns60hh30wm3v1	jason.yip@shopify.com	jason.yip	https://www.gravatar.com/avatar/010581d5a9af8f71949e0e6854cb3f6f	jason.yip
cm8ro0d0w002os60hxna3hyny	ryan.sharman@shopify.com	ryan.sharman	https://www.gravatar.com/avatar/dfe43dbafb11eb82e706c4bd1691a585	ryan.sharman
cm8rp8c4m0000s60hieqjswsr	patrick.judge@shopify.com	patrick.judge	https://www.gravatar.com/avatar/5d84e96872f1ec54c998ad6e6e91966d	patrick.judge
cm8rp9ies0001s60h5n79ucx1	gurveen.chadha@shopify.com	gurveen.chadha	https://www.gravatar.com/avatar/38c1a8fa56ecf88c8bb3a1e2b57fca9c	gurveen.chadha
cm8rpcvao0002s60hg9shzeby	eliseu.daroit@shopify.com	eliseu.daroit	https://www.gravatar.com/avatar/6af72758c8dfec1f4541bf2a239240d7	eliseu.daroit
cm8rpg4sa0003s60hulxbcjsr	pere.manresa@shopify.com	pere.manresa	https://www.gravatar.com/avatar/5fbe050f45908f81e2df49db2e7f9147	pere.manresa
cm8rpmef30004s60hxzccsad7	james.calverley@shopify.com	james.calverley	https://www.gravatar.com/avatar/68157bd994559146abab055bdb71ad9a	james.calverley
cm8rpplba0005s60howewoyn7	emily.keller@shopify.com	emily.keller	https://www.gravatar.com/avatar/5aa1aee106c45af4929560d2eda5e17a	emily.keller
cm8rpxhyr0006s60h1rvh4qi1	sam.dupras@shopify.com	sam.dupras	https://www.gravatar.com/avatar/28eb4ca304851fa5962125160c8e44d9	sam.dupras
cm8xkkdt50001s60hvd2zjs75	salomon.x@shopify.com	salomon.x	https://www.gravatar.com/avatar/67b9a7427c3b3497aafa4ba8532aa7ef	salomon.x
cm8rq00my0007s60ht7qsax7w	murdo.connochie@shopify.com	murdo.connochie	https://www.gravatar.com/avatar/ce30d43708843802f6bf634dd53bc68f	murdo.connochie
cm8rq9xl10008s60h682ntp2n	austin.cain@shopify.com	austin.cain	https://www.gravatar.com/avatar/1bde03b798c6715fb075d6fe03424bb0	austin.cain
cm8rqazgb0009s60h0qf5rdbj	sam.rose@shopify.com	sam.rose	https://www.gravatar.com/avatar/eb25c1a18cc533dda284519b12e74194	sam.rose
cm8rqc9tz000as60hueyssxp6	brendan.may@shopify.com	brendan.may	https://www.gravatar.com/avatar/356c8a8934e97e7d3e2ea8ca101e9fab	brendan.may
cm8rqfcx4000bs60hbkopuaed	dory.zhang@shopify.com	dory.zhang	https://www.gravatar.com/avatar/19ff0b694a23d49e2de6268becf46c25	dory.zhang
cm8rqp2hw000cs60hhnabwpfj	fred.plante@shopify.com	fred.plante	https://www.gravatar.com/avatar/94050df2a3522f594885ee38e002b0a7	fred.plante
cm8rqtndo000ds60hxkkhwe6x	anastasia.philopoulos@shopify.com	anastasia.philopoulos	https://www.gravatar.com/avatar/2d4d0272cc706629d972271906e61ada	anastasia.philopoulos
cm8rrn7tf000es60hcov1v029	pavel.moravek@shopify.com	pavel.moravek	https://www.gravatar.com/avatar/7d93d926569cb37e65242ae06093b65f	pavel.moravek
cm8rrqw2w000fs60hkiaj5ok9	scott.bonneau@shopify.com	scott.bonneau	https://www.gravatar.com/avatar/5f31f439928f4b3328fc25acd0b27684	scott.bonneau
cm8rs4pab000gs60hah2wphmy	todd.jefferson@shopify.com	todd.jefferson	https://www.gravatar.com/avatar/39c15fe89be49fdcc0385419bcba2b6c	todd.jefferson
cm8rsa84p000hs60hqkigm3k3	vinay.shah@shopify.com	vinay.shah	https://www.gravatar.com/avatar/ebc733a3d69a7ed7f88ae537a1049790	vinay.shah
cm8rseu21000ls60hhlfbigvq	lindsay.paul@shopify.com	lindsay.paul	https://www.gravatar.com/avatar/1746a2f23da5be7f904c2a00676a4911	lindsay.paul
cm8rtx0mp0000s60h9sucjqid	leo.kaliazine@shopify.com	leo.kaliazine	https://www.gravatar.com/avatar/85ea0cb3f20ded713cddcfaa404a8b3a	leo.kaliazine
cm8ru149q0001s60h6sefsay9	raman.lally@shopify.com	raman.lally	https://www.gravatar.com/avatar/099abc9cec45025615e435ac19d8f186	raman.lally
cm8ru2fts0002s60ha60oz3ur	elizabeth.mcgrew@shopify.com	elizabeth.mcgrew	https://www.gravatar.com/avatar/49712fdd2637f9b5f79497961e3131e2	elizabeth.mcgrew
cm8ru7ucd0003s60hm5kqwdqq	tobi@shopify.com	tobi	https://www.gravatar.com/avatar/44a1b8a3a990e1a496261f55cd44fbd9	tobi
cm8ru9bfv0004s60hzpjr6hwo	brett.wallace@shopify.com	brett.wallace	https://www.gravatar.com/avatar/8900a2fa16b639219e9af1819aec011e	brett.wallace
cm8ruy0om0007s60h49816u3b	sal.rapisarldi@shopify.com	sal.rapisarldi	https://www.gravatar.com/avatar/35296b9cb3eb619cf79b980dc3cad166	sal.rapisarldi
cm8ruya8t0008s60hurhcq9dt	minhan.ho@shopify.com	minhan.ho	https://www.gravatar.com/avatar/c2abda100312d9c89b779aa036fdd468	minhan.ho
cm8rv5fwn0009s60hq6mhxbwx	lawson.jaglomkurtz@shopify.com	lawson.jaglomkurtz	https://www.gravatar.com/avatar/25427bacdc338bb77ad37955522e8e10	lawson.jaglomkurtz
cm8rvdjva000as60hf6vtcg4f	vitor.rigoni@shopify.com	vitor.rigoni	https://www.gravatar.com/avatar/08d1120a0b5c0332924da6ba4b708ff7	vitor.rigoni
cm8rw0u59000bs60hj37mt2hm	alex.lyons@shopify.com	alex.lyons	https://www.gravatar.com/avatar/326afc583bf6390de20f6d98551e5848	alex.lyons
cm8ry30f10000s60hs48hv5wf	jose.degyves@shopify.com	jose.degyves	https://www.gravatar.com/avatar/3e1cf9d4f80f8a2a50cf2316b1fbb429	jose.degyves
cm8rzs10n0000s60hy8qokpfg	tom.krouper@shopify.com	tom.krouper	https://www.gravatar.com/avatar/a88ee8c15ae81feb2d3eac3c26b7a547	tom.krouper
cm8s2oja60000s60hr0cpa12o	philip.chen@shopify.com	philip.chen	https://www.gravatar.com/avatar/0eb4819fd3c276cddccbca84510ab75b	philip.chen
cm8s4vvz70000s60hmn1i9nsk	gulam.moledina@shopify.com	gulam.moledina	https://www.gravatar.com/avatar/9505c54736a3cc113928248a6669514e	gulam.moledina
cm8s9odsb0000s60hp12a2zbf	mao.suzuki@shopify.com	mao.suzuki	https://www.gravatar.com/avatar/ac99644937b18af38b1f0d9ff235a14a	mao.suzuki
cm8sbul110000s60h5vos6ia9	michael.wilson@shopify.com	michael.wilson	https://www.gravatar.com/avatar/5fc3f2f5ad4a1aae34a511562c5e165e	michael.wilson
cm8sgqsfc0000s60h0120gnt9	max.leopold@shopify.com	max.leopold	https://www.gravatar.com/avatar/448d4a833cae223a8e06b038f44d6d15	max.leopold
cm8skr59o0000s60hoov8mhus	calvin.walzel@shopify.com	calvin.walzel	https://www.gravatar.com/avatar/4ad10ffe3d04f90b91c7860a94b22d64	calvin.walzel
cm8sov6si0000s60h0kglz4xg	gerard.kelly@shopify.com	gerard.kelly	https://www.gravatar.com/avatar/667f04a7d5cb863173ea0041adbe6ba5	gerard.kelly
cm8spareh0001s60hn3fj7wby	danielle.cookgrant@shopify.com	danielle.cookgrant	https://www.gravatar.com/avatar/a0c3109829aa4e97da0aeea9848f3515	danielle.cookgrant
cm8stdbcz0000s60hfqbddj7t	natasha.yang@shopify.com	natasha.yang	https://www.gravatar.com/avatar/ef70c7941a74cd614c00487b0c8b603e	natasha.yang
cm8stlq7h0001s60h80lic5po	christie.whyte@shopify.com	christie.whyte	https://www.gravatar.com/avatar/68f6dd01d477e69ce05a048e20960699	christie.whyte
cm8stybly0002s60hftnein0g	brenda.wisniowski@shopify.com	brenda.wisniowski	https://www.gravatar.com/avatar/6bf402b4d82df76adb78986f227b1c0b	brenda.wisniowski
cm8sv70810000s60h9bnld0k0	soumya.shukla@shopify.com	soumya.shukla	https://www.gravatar.com/avatar/07fbd7b78e9e69a734b3fad0d13dc902	soumya.shukla
cm8svg28f0001s60hjb8moa6f	samantha.turri@shopify.com	samantha.turri	https://www.gravatar.com/avatar/685c6e84370162f462c4eb30105f190d	samantha.turri
cm8svj6ha0002s60hd8pxumpl	kevin.hendry@shopify.com	kevin.hendry	https://www.gravatar.com/avatar/c12bd911c09144c276af5e13163aea28	kevin.hendry
cm8svp56r0003s60hnluo7mfz	eugene.havrylov@shopify.com	eugene.havrylov	https://www.gravatar.com/avatar/393d881b6034cd06bc3852022eff8d06	eugene.havrylov
cm8sx3v160004s60hi3yov2ss	jay.cha@shopify.com	jay.cha	https://www.gravatar.com/avatar/78eed90dafcbcae0cbb38817a670581b	jay.cha
cm8sxkr8d0005s60hvegahyc9	jeremiah.butler@shopify.com	jeremiah.butler	https://www.gravatar.com/avatar/e5717443e906a6beaf87b72847b5ab74	jeremiah.butler
cm8sxl6ns0006s60hkqslh3i0	christopher.nicholson@shopify.com	christopher.nicholson	https://www.gravatar.com/avatar/f3a9d9b3f3a4e3868883c207b93684aa	christopher.nicholson
cm8sybtkq0007s60hzqbthufi	shawn.leekwong@shopify.com	shawn.leekwong	https://www.gravatar.com/avatar/d9582e6c221e1de101791070470b243e	shawn.leekwong
cm8syk80u0008s60h8kg7lgor	scott.robertson@shopify.com	scott.robertson	https://www.gravatar.com/avatar/b29fa2d7ac3d63cde07fe47504f083ee	scott.robertson
cm8sz9owp0009s60h5wghyhxg	ryan.snape@shopify.com	ryan.snape	https://www.gravatar.com/avatar/f16fc7584855f892910f31a3eba0f616	ryan.snape
cm8szhir5000as60h8pco9349	harrison.mitgang@shopify.com	harrison.mitgang	https://www.gravatar.com/avatar/07a92ce85a577c9445555f6e3e04df95	harrison.mitgang
cm8t0iw64000bs60h0duwh2k6	osaru.izeiyamu@shopify.com	osaru.izeiyamu	https://www.gravatar.com/avatar/6ccc5eff0384d2ffceb48b58b3cad4a2	osaru.izeiyamu
cm8t13gwv000cs60hfflvjtio	trevor.harmon@shopify.com	trevor.harmon	https://www.gravatar.com/avatar/0babda2d09f79e01febb2fd5be4ec6fa	trevor.harmon
cm8t23imn000ds60horpt3sj9	chelsea.mouchantaf@shopify.com	chelsea.mouchantaf	https://www.gravatar.com/avatar/572e256cd5ac98c1a7f3effc639209f6	chelsea.mouchantaf
cm8t2rf7k000es60h0uxax6m5	tim.keelan@shopify.com	tim.keelan	https://www.gravatar.com/avatar/a8bce4137accfc5453b5ef3a5c764f61	tim.keelan
cm8t34fw1000fs60hqbby1i50	kunal.kohli@shopify.com	kunal.kohli	https://www.gravatar.com/avatar/51e29b2b16d7cb88e14e99f32bd97760	kunal.kohli
cm8t3d9ez000gs60hxnhdww9l	chelsea.truscott@shopify.com	chelsea.truscott	https://www.gravatar.com/avatar/7044d21416120ce95adb1a7086dbd572	chelsea.truscott
cm8t46tzr000hs60hm5wrdi4d	austen.lacy@shopify.com	austen.lacy	https://www.gravatar.com/avatar/dfd82bdf2705cc2f2960a68907be8ae8	austen.lacy
cm8t4e3jk000ls60hffmpzvo3	jeremy.ward@shopify.com	jeremy.ward	https://www.gravatar.com/avatar/c9190c355f20c820617990c1eb5bf40c	jeremy.ward
cm8t57lhm000ms60h1xbbh4qs	anam.tariq@shopify.com	anam.tariq	https://www.gravatar.com/avatar/29b9841ff7c87d098234a960a836227d	anam.tariq
cm8t5dczu000ns60hrrdxqowd	nanakwame.acheampong@shopify.com	nanakwame.acheampong	https://www.gravatar.com/avatar/ca594d5136a81c9d2ea456d338d018f0	nanakwame.acheampong
cm8t5f1aw000os60h62okyf5u	ana.castro@shopify.com	ana.castro	https://www.gravatar.com/avatar/7e72ca10e81f0c5563dc9e63772a3980	ana.castro
cm8t6gs4p000ps60hhafr75d1	maxime.moyson@shopify.com	maxime.moyson	https://www.gravatar.com/avatar/b67adad0ffc6bd34c88733648e51fc7d	maxime.moyson
cm8t7cti6000qs60hp68uye6o	sam.bostock@shopify.com	sam.bostock	https://www.gravatar.com/avatar/2906c7c1019a87140e2b8f7f6e36008d	sam.bostock
cm8t84udy000rs60h35pn0kl9	jill.finlayson@shopify.com	jill.finlayson	https://www.gravatar.com/avatar/beb5458e74d671c6207f1ba83887b7ed	jill.finlayson
cm8t8fykp000ss60h3mdbqglf	eric.walker@shopify.com	eric.walker	https://www.gravatar.com/avatar/ed83b520580a4f61aa054b2ee8e22575	eric.walker
cm8t94yis000ts60hhd6r5oza	jeremy.ludwig@shopify.com	jeremy.ludwig	https://www.gravatar.com/avatar/dea0aaea16a78a515bce0426b86c5328	jeremy.ludwig
cm8t9g5vq000us60hmww3b8ga	carmen.spitz@shopify.com	carmen.spitz	https://www.gravatar.com/avatar/6daf333cf40661f906c5c92914b06465	carmen.spitz
cm8t9giy5000vs60hxwlcmiza	kyle.dornblaser@shopify.com	kyle.dornblaser	https://www.gravatar.com/avatar/9ce56b13458290ab34ad7205157c6be5	kyle.dornblaser
cm8tybxmd0000s60hos3abii5	lucas.mohnen@shopify.com	lucas.mohnen	https://www.gravatar.com/avatar/4153197a44a4c50ef390c9554431ecf1	lucas.mohnen
cm8wes8rd0000s60hsiuj6o9e	lina.bohorquez@shopify.com	lina.bohorquez	https://www.gravatar.com/avatar/ef9cf0a79aa96350f45a66a9566d4606	lina.bohorquez
cm8wo24fw0000s60hg9duqfa4	lea.gutic@shopify.com	lea.gutic	https://www.gravatar.com/avatar/aa816a5132ba929cf7bba39f8d6a94b4	lea.gutic
cm8wso5ps0000s60ounfhe84m	josh.dowling@shopify.com	josh.dowling	https://www.gravatar.com/avatar/8c2ec2fd414b861215c6d2057ea8325d	josh.dowling
cm8wz6bal0000s60hdz0b1fje	patrick.millward@shopify.com	patrick.millward	https://www.gravatar.com/avatar/4e2d196bdfd203ea1f28266106b2d41a	patrick.millward
cm8x0rvvw0000s60ht4xx5imw	calvin.delima@shopify.com	calvin.delima	https://www.gravatar.com/avatar/24549fde774e63c94b9666d2a71299a1	calvin.delima
cm8x0yzrv0001s60h5pct4r17	quique.fagoaga@shopify.com	quique.fagoaga	https://www.gravatar.com/avatar/c2bf37766cb2cd9ffb4dacbb352aca71	quique.fagoaga
cm8x2y9fw0000s60ouqkd0wzk	alex.ilea@shopify.com	alex.ilea	https://www.gravatar.com/avatar/cac646b2d677d56472184a3b9ab29b98	alex.ilea
cm8x45ebe0000s60hc1xhcoox	charles.bougard@shopify.com	charles.bougard	https://www.gravatar.com/avatar/853db9f1429e37583b13ddddabbf53f1	charles.bougard
cm8x4cse20001s60hejj0mtgq	elizabeth.mcguane@shopify.com	elizabeth.mcguane	https://www.gravatar.com/avatar/1c3b8e0986fa45d1b0c0822bc522f1eb	elizabeth.mcguane
cm8x5r7tk0002s60hzu50tpkt	john.arthorne@shopify.com	john.arthorne	https://www.gravatar.com/avatar/1828af2cbd8019f6a80672abbe1738e6	john.arthorne
cm8x6htg10003s60htfz7qid7	sandra.collay@shopify.com	sandra.collay	https://www.gravatar.com/avatar/a882abffeb2e6d9509e7c0211e3cc9ba	sandra.collay
cm8x6r4e90004s60h5j0e1qqq	beth.townsend@shopify.com	beth.townsend	https://www.gravatar.com/avatar/40f70fb7fda4603adc79741aeaf4d176	beth.townsend
cm8x77v5z0005s60hcp894wwc	javier.barrera@shopify.com	javier.barrera	https://www.gravatar.com/avatar/9080ddf2bfd5fcf6522fc2f7cb65ee35	javier.barrera
cm8x7mf9x0006s60h3z7v298r	selene.hinkley@shopify.com	selene.hinkley	https://www.gravatar.com/avatar/214d3ec1973e7af63f9e1d944e80878a	selene.hinkley
cm8x86if60007s60hsavlu472	stuart.instrell@shopify.com	stuart.instrell	https://www.gravatar.com/avatar/ef8e09dbcc11cf339e1fb90821f28ed3	stuart.instrell
cm8x86iyw0008s60hlpptg273	rishvika.mehta@shopify.com	rishvika.mehta	https://www.gravatar.com/avatar/bfe9e033a734940e30383bfde9e3aabe	rishvika.mehta
cm8x8jkpv0009s60hhy8ioqum	cara.luke@shopify.com	cara.luke	https://www.gravatar.com/avatar/aefb126e91274c1fa944078dd02b5154	cara.luke
cm8xar7n70000s60htncbv94a	ellie.keller@shopify.com	ellie.keller	https://www.gravatar.com/avatar/cff9a355088537f1b744727120c31722	ellie.keller
cm8xb4iro0001s60hbzyuqq5y	jennifer.rogers@shopify.com	jennifer.rogers	https://www.gravatar.com/avatar/a707ccac19577d8c702d1d4c5d601b99	jennifer.rogers
cm8xcmgp70002s60hc0109nr3	tiana.smith@shopify.com	tiana.smith	https://www.gravatar.com/avatar/b37a5a5a28f603c09907d62885b3a51f	tiana.smith
cm8xcmj7b0003s60h3avpn4db	brad.lindsay@shopify.com	brad.lindsay	https://www.gravatar.com/avatar/8c63f0e49c7aaa413aaffef507d860c7	brad.lindsay
cm8xdn9vj0004s60hzhfcubqw	susie.simon@shopify.com	susie.simon	https://www.gravatar.com/avatar/aeeedc749298584103e53dec8d014720	susie.simon
cm8xeznlz0005s60hufri6ip5	steve.bosworth@shopify.com	steve.bosworth	https://www.gravatar.com/avatar/f2f16d63db1d6c9fd26d6a2468ca3748	steve.bosworth
cm8xfcul50006s60hvbgxt85o	jake.pope@shopify.com	jake.pope	https://www.gravatar.com/avatar/e19d709e795877ab7664e04f6f1d7d66	jake.pope
cm8xgyco20000s60hwuq74r69	isabella.chan@shopify.com	isabella.chan	https://www.gravatar.com/avatar/4f1802c3ad14cdf42d0a0d417978c869	isabella.chan
cm8xh00wf0001s60hot36rv7n	john.chan@shopify.com	john.chan	https://www.gravatar.com/avatar/2251eab1578bfffb3d896bbf2b9efadb	john.chan
cm8xjzd040000s60hlp1km7ti	emmanuel.kaunitz@shopify.com	emmanuel.kaunitz	https://www.gravatar.com/avatar/3b661d5db2f48ea078f4b7b8f7f1bb6d	emmanuel.kaunitz
cm8xmldw70002s60hlxf1q9ok	ben.thul@shopify.com	ben.thul	https://www.gravatar.com/avatar/af94a39b8a1adf335b5486e001048308	ben.thul
cm8xnodnx0006s60hpux14qdt	ian.delahorne@shopify.com	ian.delahorne	https://www.gravatar.com/avatar/c0c9383f854c87c9207117b5b4a21275	ian.delahorne
cm8xp9b7w0000s60hs90u9d84	ash.christopher@shopify.com	ash.christopher	https://www.gravatar.com/avatar/16c5898ff2b2107ebf11918500165f84	ash.christopher
cm8xs17vl0000s60h4roz89t4	jeremiah.abalos@shopify.com	jeremiah.abalos	https://www.gravatar.com/avatar/178ea40f002225d17034df678ec16cf7	jeremiah.abalos
cm8xuq4k20000s60har4iacrd	kerry.walsh@shopify.com	kerry.walsh	https://www.gravatar.com/avatar/b7251ae913fabc1aa5da5d0940768e9c	kerry.walsh
cm8yh2wk20000s60hslvttpqc	austin.clooney@shopify.com	austin.clooney	https://www.gravatar.com/avatar/476565e7a2dc1a0e2b08cd7a5762a547	austin.clooney
cm8ym6mhr0003s60h999i0t92	muhammad.mukhtar@shopify.com	muhammad.mukhtar	https://www.gravatar.com/avatar/619684064e42d72f0f807cefc0670df4	muhammad.mukhtar
cm8ymwpcl0004s60hygrul8ks	jordan.stern@shopify.com	jordan.stern	https://www.gravatar.com/avatar/ec2122f02829f4fe0e9800e347a1daab	jordan.stern
cm8yojhiu0007s60hpfm11exf	christine.cassis@shopify.com	christine.cassis	https://www.gravatar.com/avatar/910ccc966e24d8ee94b703c969c2f292	christine.cassis
cm8yokd960008s60h0gdx2n36	emma.hanninen@shopify.com	emma.hanninen	https://www.gravatar.com/avatar/8ca360ca3b5b16f06be0815100ceef19	emma.hanninen
cm8youc280009s60h7dlzzzii	chrissy.sztainert@shopify.com	chrissy.sztainert	https://www.gravatar.com/avatar/5c64820c351755a2d2e9e507b88b5aa0	chrissy.sztainert
cm8ytajbx0001s60h7ca4cev5	arnaud.tanielian@shopify.com	arnaud.tanielian	https://www.gravatar.com/avatar/a727305197a35e3c979d7a446f0be6f7	arnaud.tanielian
cm8yver560000s60h40olygwa	ward.sorrick@shopify.com	ward.sorrick	https://www.gravatar.com/avatar/1b9c02e8611923e49664f8320e04172e	ward.sorrick
cm8yvz0e40001s60hunmkpkra	sabrina.lobo@shopify.com	sabrina.lobo	https://www.gravatar.com/avatar/5daf5d5ed7ab5cdd9073249a86da6083	sabrina.lobo
cm8yy2ngo0002s60hqqno3iac	dave.meisner@shopify.com	dave.meisner	https://www.gravatar.com/avatar/de6dbf7857e3eb98d7b392f3bb533288	dave.meisner
cm8z0r4yx0003s60ha7qrmr58	anshudeep.mathur@shopify.com	anshudeep.mathur	https://www.gravatar.com/avatar/fe02eaae1a18e588214f4fe0ae753b76	anshudeep.mathur
cm8z54ull0000s60h01t9qvel	yichun.cheng@shopify.com	yichun.cheng	https://www.gravatar.com/avatar/1d68d07259eebfca763879770ba80ddc	yichun.cheng
cm8z5x2kb0001s60hw0k73kfa	cynthia.nguyen@shopify.com	cynthia.nguyen	https://www.gravatar.com/avatar/5c87e37641d94c51148bcfb1d574ef37	cynthia.nguyen
cm8zxla0e0000s60h9xuufeqm	phil.vanstone@shopify.com	phil.vanstone	https://www.gravatar.com/avatar/3faeb75b179db7895a5534eefa5d9770	phil.vanstone
cm8zyz6m60001s60hsn1amg8r	david.hoffman@shopify.com	david.hoffman	https://www.gravatar.com/avatar/f84e1ab3b120749a70093e056b1300c5	david.hoffman
cm901ne1e0000s60h9sippb33	amaresh.parameswaran@shopify.com	amaresh.parameswaran	https://www.gravatar.com/avatar/8597b14e7729ef6b7a3c2b89470d31b0	amaresh.parameswaran
cm906hday0000s60hp56vj00c	jonathan.sinclair@shopify.com	jonathan.sinclair	https://www.gravatar.com/avatar/3a2b9260e7f0b2be51661c7a516840f5	jonathan.sinclair
cm90a6ep50000s60hinipyvfi	vihar.kothamasu@shopify.com	vihar.kothamasu	https://www.gravatar.com/avatar/56cb590a8b22afd2ec35b5834b27a352	vihar.kothamasu
cm90bkub90001s60happvaklf	elliot.walters@shopify.com	elliot.walters	https://www.gravatar.com/avatar/6c8c2f3065a6993ca467f16ab56c2013	elliot.walters
cm90bpzb40002s60hgw3wgz51	sarah.levinsky@shopify.com	sarah.levinsky	https://www.gravatar.com/avatar/701a2f61ca7901300570945764aeb01d	sarah.levinsky
cm8okkpn20004s60hi9twmhhm	riley.walker@shopify.com	Riley Walker	https://www.gravatar.com/avatar/07f6d56d1dcb9f6a5552f77c1678646e	riley.walker
cm91js78v0000s60hkfs8119s	natasha.lacasse@shopify.com	natasha.lacasse	https://www.gravatar.com/avatar/2bee0700e90a6cc5fc2fe1c769e7b5e5	natasha.lacasse
cm91k4ysy0001s60hdplg65fa	dani.moubayed@shopify.com	dani.moubayed	https://www.gravatar.com/avatar/2a5ac486d8da2cd5a82236276309d9c6	dani.moubayed
cm91vcro30000s60ha8at1501	selina.ali@shopify.com	selina.ali	https://www.gravatar.com/avatar/2641cfd27ecb5aac229425173659bcdd	selina.ali
cm92mck5g0000s60hl21oq41n	emma.boardman@shopify.com	emma.boardman	https://www.gravatar.com/avatar/7db340a8d6d6226211751e43df55fcf3	emma.boardman
cm96ryjra0000s60hl61p9x6e	dimitar.panov@shopify.com	dimitar.panov	https://www.gravatar.com/avatar/c29d3ab8dcc8dfbefbe08245511a6311	dimitar.panov
cm97eexj40000s60h9oerv3n8	sarah.kim@shopify.com	sarah.kim	https://www.gravatar.com/avatar/79da1c29ad7e15fedec509d98de11c09	sarah.kim
cm97kk4nq0004s60hkijity4k	william.leiter@shopify.com	william.leiter	https://www.gravatar.com/avatar/be9552a5fe7c3e3c4f5e0bc0ea970939	william.leiter
cm987pher0000s60hstwz2dyo	aaron.guthrie@shopify.com	aaron.guthrie	https://www.gravatar.com/avatar/69aa417a65b60cd379e415c74d41e12c	aaron.guthrie
cm98k1bkz0000s60hk5mmsn21	robert.wang@shopify.com	robert.wang	https://www.gravatar.com/avatar/4e3891aabff08f2dd1f69fba03360d57	robert.wang
cm98n4dwg0003s60h89e7c4zr	sam.jones@shopify.com	sam.jones	https://www.gravatar.com/avatar/330ff1307ecd99ff4080f910e8b30357	sam.jones
cm98n88ii0004s60hhnu4s5en	kyle.dormer@shopify.com	kyle.dormer	https://www.gravatar.com/avatar/9fd7c493c9cdfc3c7b7e1b04fb87a682	kyle.dormer
cm98sb8000000s60hokur3jv6	melanie.clarke@shopify.com	melanie.clarke	https://www.gravatar.com/avatar/fe7cc859bde5caf34181e1d08eff6beb	melanie.clarke
cm98y6uhc0000s60hv9rd0y4r	sydney.nguyen@shopify.com	sydney.nguyen	https://www.gravatar.com/avatar/5091ee744a331aec8779bd98b47928b8	sydney.nguyen
cm992kk5p0000s60hazh03qqg	ryan.harter@shopify.com	ryan.harter	https://www.gravatar.com/avatar/27f779daeae9adab35f4820094fc6a72	ryan.harter
cm9a4uiz50000s60h9etzsbuf	dan.rohr@shopify.com	dan.rohr	https://www.gravatar.com/avatar/2c4f311bde0b58941c4456e941420575	dan.rohr
cm9a8iy7w0000s60hfq6eandz	mike.welsh@shopify.com	mike.welsh	https://www.gravatar.com/avatar/b6bed78e092f774fda9100829a4d9bb9	mike.welsh
cm9aagjna0000s60hio5bk4lr	noah.woodward@shopify.com	noah.woodward	https://www.gravatar.com/avatar/b7b3adb53b0fa953a7034ead7671044e	noah.woodward
cm9bt4iv60003s60hlw08w716	joey.schuster@shopify.com	joey.schuster	https://www.gravatar.com/avatar/53f9ced640bcac97d009350a42226ee7	joey.schuster
cmebusv2i001ls60hxfwlmwva	dana.ng@shopify.com	dana.ng	https://www.gravatar.com/avatar/a2ac6bfe32ce2ac6be6cd3a92e0a7d0b	dana.ng
cmebusv7f001ms60ht1lwz21a	chris.cosentino@shopify.com	chris.cosentino	https://www.gravatar.com/avatar/a85e5777a1ab7d98302f9019382591e3	chris.cosentino
cm9cw8io00000s60hpexmf880	stephanie.lin@shopify.com	stephanie.lin	https://www.gravatar.com/avatar/c8a345616fbe1f433e486dbad7671585	stephanie.lin
cm9fjtexw0000s60hm0vzzpu5	eduardo.mujica@shopify.com	eduardo.mujica	https://www.gravatar.com/avatar/3d74d3c3fec81889d1e295a3971e1a29	eduardo.mujica
cm9h9qhvc0000s60hj4ze5jmz	ignacio.galindo@shopify.com	ignacio.galindo	https://www.gravatar.com/avatar/f5d085080f2aab9a57c622bcd29a0bf6	ignacio.galindo
cm9hdqo290000s60hoglkoy5m	julia.vallelunga@shopify.com	julia.vallelunga	https://www.gravatar.com/avatar/6835d3e821e055aa210ff409d17df38c	julia.vallelunga
cm9hdzzaz0004s60hq64seu3w	patrick.mclennan@shopify.com	patrick.mclennan	https://www.gravatar.com/avatar/11b62307bad18d9db8d51eee978e4d40	patrick.mclennan
cm9lcfun60000s60h5jklh55u	anusha.shanmugarajah@shopify.com	anusha.shanmugarajah	https://www.gravatar.com/avatar/1c0df8c364730d543140ca68a1ac37b2	anusha.shanmugarajah
cm9lswljm0000s60h0v8xjzz8	cristobal.aguirre@shopify.com	cristobal.aguirre	https://www.gravatar.com/avatar/53252785d2ce9ab8e0ec27104928695a	cristobal.aguirre
cm9m1nsvm0000s60hvouinxwa	david.wurtz@shopify.com	david.wurtz	https://www.gravatar.com/avatar/264ea2164c2ccb467650f3de409258ed	david.wurtz
cm9mqgpaw0000s60hmnbzdwoc	colby.fayock@shopify.com	colby.fayock	https://www.gravatar.com/avatar/bff0ba0d1037b26a59d9b67aa48c6a84	colby.fayock
cm9mv3ram0000s60hubcc9hlu	heidi.maissan@shopify.com	heidi.maissan	https://www.gravatar.com/avatar/2d473d30e840985f57e89a0e0875bbb3	heidi.maissan
cm9mxe24y0000s60h7y63waxw	jess.peterson@shopify.com	jess.peterson	https://www.gravatar.com/avatar/c3765432178a82f2a2bd5aff5dc187b5	jess.peterson
cm9r4rsbr0000s60hco7ezy7m	meredith.castile@shopify.com	meredith.castile	https://www.gravatar.com/avatar/cd17ea53775424b8fcd50c30b3f881fe	meredith.castile
cm9r63ydr0000s60hlp5k3pxk	emily.rucker@shopify.com	emily.rucker	https://www.gravatar.com/avatar/2a8349f1af9585d93698688ffe9cac68	emily.rucker
cm9r7l1f10000s60hq8gvmecx	kris.puckett@shopify.com	kris.puckett	https://www.gravatar.com/avatar/e0765c875e61c95578c5c41cf6f32674	kris.puckett
cm9r843b40003s60h576qa6py	francesca.garcea@shopify.com	francesca.garcea	https://www.gravatar.com/avatar/677cc64dcff0554c050fb12bee72602d	francesca.garcea
cm9r84cnz0004s60hj6g0czgo	stephanie.harris@shopify.com	stephanie.harris	https://www.gravatar.com/avatar/2d41e7ddc259d947083868db30a2c22e	stephanie.harris
cm9sdwgvn0000s60h2a5vs3um	daniel.nieuwenhuizen@shopify.com	daniel.nieuwenhuizen	https://www.gravatar.com/avatar/7a544d4e123bd542d33eabb2cf6eccf2	daniel.nieuwenhuizen
cm9slr1cq0000s60h7gt2sh4h	jane.tran@shopify.com	jane.tran	https://www.gravatar.com/avatar/ef89a1d878bf271a641500268745302e	jane.tran
cm9syjqkg0000s60h902wqak6	lance.holmes@shopify.com	lance.holmes	https://www.gravatar.com/avatar/0cbc436c103dc7f03e7e9d051f6b1608	lance.holmes
cm9tyb4ci0000s60hl6o3vv62	raquel.vila@shopify.com	raquel.vila	https://www.gravatar.com/avatar/10dc26032f34124ea37772b18ff1ed3b	raquel.vila
cm9u5swoy0000s60hm1c02s3u	susan.van@shopify.com	susan.van	https://www.gravatar.com/avatar/e4f56f638f59f0035e5f7720ab131edf	susan.van
cm9u7dhwd0000s60hin5hui0w	nuria.crosas@shopify.com	nuria.crosas	https://www.gravatar.com/avatar/2996489a716be6e407894d17c43a3417	nuria.crosas
cm9vk4eil0000s60hp3gnceoo	tasha.anestopoulos@shopify.com	tasha.anestopoulos	https://www.gravatar.com/avatar/0a93102f4a0bd9b4b45ea8fbd2c34af4	tasha.anestopoulos
cm9vrb4zx0000s60hitqyfstn	evemarie.blouinhudon@shopify.com	evemarie.blouinhudon	https://www.gravatar.com/avatar/a895f78c6af5c2919542751775f709cd	evemarie.blouinhudon
cm9wigff80000s60hgynx5c87	alejandra.temprana@shopify.com	alejandra.temprana	https://www.gravatar.com/avatar/32a3b22d5bc57b58b15fa484a6b473b5	alejandra.temprana
cm9xa5zct0000s60h745xjcqi	mitchell.sidharta@shopify.com	mitchell.sidharta	https://www.gravatar.com/avatar/e0a54ae9d53569b635ac1401f6694dca	mitchell.sidharta
cma2kpp6n0000s60hkrf5acnl	jose.torre@shopify.com	jose.torre	https://www.gravatar.com/avatar/3017eaf46a65ff346d59f10fb07a708d	jose.torre
cma2lgp1c0000s60hs5ybjkrf	austin.woodall@shopify.com	austin.woodall	https://www.gravatar.com/avatar/6348cc3ff087155a0e6eecb1089ec2d1	austin.woodall
cma3yhhpa0000s60htu46mneu	donn.pasiliao@shopify.com	donn.pasiliao	https://www.gravatar.com/avatar/ee3d6b17d8dcc5678ef3db9d6e7f5279	donn.pasiliao
cma43psyu0000s60hjjyb8871	jon.cardasis@shopify.com	jon.cardasis	https://www.gravatar.com/avatar/72466a989accf180914c23243f1be9b3	jon.cardasis
cma5g5bsg0000s60h3illyadz	ron.goldin@shopify.com	ron.goldin	https://www.gravatar.com/avatar/39c7b5e87b18c61fb38a31f01db18c7f	ron.goldin
cma738hsf0000s60hmpibjhup	carlin.scuderi@shopify.com	carlin.scuderi	https://www.gravatar.com/avatar/46067f015a0a1ca01bd507780975c2e8	carlin.scuderi
cma73fsix0001s60hxhc4hgxd	krista.nelson@shopify.com	krista.nelson	https://www.gravatar.com/avatar/de00f43d68022925becc6110c6b90e1c	krista.nelson
cma73ft9r0002s60hvxy4zf1j	nick.scola@shopify.com	nick.scola	https://www.gravatar.com/avatar/79dac71f8876a650626924758a890f5f	nick.scola
cma73h0jq0003s60ht7ns9sgc	andrew.nickerson@shopify.com	andrew.nickerson	https://www.gravatar.com/avatar/31d4564e76b44b4c2e911990320c3649	andrew.nickerson
cma73j0rt0004s60hx74rq40g	sagar.maria@shopify.com	sagar.maria	https://www.gravatar.com/avatar/8f9cc5523ba49253db5c2938ae9a8dda	sagar.maria
cma73snjg0005s60hcic0gqid	zane.alsabery@shopify.com	zane.alsabery	https://www.gravatar.com/avatar/8c3fa22c9fba5bf869406b9147c4927a	zane.alsabery
cma7459n50006s60hpk2gz4f7	sarah.mcnally@shopify.com	sarah.mcnally	https://www.gravatar.com/avatar/c16e3e60796f221c21e5ac837f81dca9	sarah.mcnally
cma75lbux0000s60hdfgkglk0	ian.quan@shopify.com	ian.quan	https://www.gravatar.com/avatar/cddff56d9bc743f4f76f2ec4d2d4c7db	ian.quan
cma75mzem0001s60hz1opk06s	james.simpson@shopify.com	james.simpson	https://www.gravatar.com/avatar/43a4125014b17bef0db06ea43d38072a	james.simpson
cma75t6xu0002s60hks4uexej	josh.patterson@shopify.com	josh.patterson	https://www.gravatar.com/avatar/a6d297ff26a47232ec9c8e6edf0d2417	josh.patterson
cma78sufi0000s60he752t8li	joao.saldanha@shopify.com	joao.saldanha	https://www.gravatar.com/avatar/737953aff5629cff8a029cff067c1a61	joao.saldanha
cmafgk7v00000s60h7tewxik4	jen.shaw@shopify.com	jen.shaw	https://www.gravatar.com/avatar/01596d03d639d24d615140d6ecd36475	jen.shaw
cmacwil520005s60hv7oojci9	peter.kaoud@shopify.com	peter.kaoud	https://www.gravatar.com/avatar/f8bf3c38b0cfe5bf698220d9c4bb00b1	peter.kaoud
cmagxa4qw0000s60hk8878uu5	oussama.ameknassi@shopify.com	oussama.ameknassi	https://www.gravatar.com/avatar/1382b2857864408efaae7c648a9594f3	oussama.ameknassi
cmagxa75q0001s60h99p4z8yh	helena.xu@shopify.com	helena.xu	https://www.gravatar.com/avatar/14d887da92b45f1345f66aabb839758d	helena.xu
cmaikmnkb0000s60haubjxxr3	mathieu.perreault@shopify.com	mathieu.perreault	https://www.gravatar.com/avatar/fc15279ee10f8bc4590504bf958b0eac	mathieu.perreault
cmalffadt0000s60hr5a8wjtk	janna.falasco@shopify.com	janna.falasco	https://www.gravatar.com/avatar/e262b9bc6dcaaee69153bb61b3d914ee	janna.falasco
cmamkf2js0000s60hjoasfxp1	elizabeth.sanford@shopify.com	elizabeth.sanford	https://www.gravatar.com/avatar/daa9c53244e04f178bb5418a3822aeac	elizabeth.sanford
cmebv40ow000qs60hxxl6y1m9	max.schreiter@shopify.com	max.schreiter	https://www.gravatar.com/avatar/f1dfc4b10a6ec86fd60189e1fdddbf9a	max.schreiter
cmapnmbys0000s60hf8so57b1	nayeob.kim@shopify.com	nayeob.kim	https://www.gravatar.com/avatar/850dd405ca1918cc7076322d4d96f881	nayeob.kim
cmapt79q70000s60hm7bjdi6i	annemarie.leger@shopify.com	annemarie.leger	https://www.gravatar.com/avatar/d99e2a74be385d4d3f081509bc1a57e4	annemarie.leger
cmav7qkid0000s60hbjk97u4i	katie.bent@shopify.com	katie.bent	https://www.gravatar.com/avatar/423a90e9785e33891f630c79f01827dc	katie.bent
cmav8o9fs0000s60h7vbsqhe1	lloyd.alexander@shopify.com	lloyd.alexander	https://www.gravatar.com/avatar/1e679d135c1c0ae1ca3deca7428a43b3	lloyd.alexander
cmav9a5670004s60hyh0z78wh	catherine.cheng@shopify.com	catherine.cheng	https://www.gravatar.com/avatar/8b7d18206d13850f9ba1e7407fdf9a11	catherine.cheng
cmavb2x0p0000s60hctxqmk4g	quincy.adamo@shopify.com	quincy.adamo	https://www.gravatar.com/avatar/ac71983de6739c9bdd9200a81e856301	quincy.adamo
cmavet6pw0000s60hpulephoe	matt.farmer@shopify.com	matt.farmer	https://www.gravatar.com/avatar/05325afbaa3ed4fe161f0099c6063ad6	matt.farmer
cmavmbjez0000s60hacfjtkqa	tanner.kulbashian@shopify.com	tanner.kulbashian	https://www.gravatar.com/avatar/b53ede6c4fc38c16eb34921b45d5ce29	tanner.kulbashian
cmawjbj7k0000s60h9p6fu1s8	jessamae.alcantara@shopify.com	jessamae.alcantara	https://www.gravatar.com/avatar/206324c73a7819bc4633ac9508f20be1	jessamae.alcantara
cmawl692g0000s60he8riavrv	chris.seibel@shopify.com	chris.seibel	https://www.gravatar.com/avatar/c6506054fde2eef3b8afdac48332f51d	chris.seibel
cmaxyvs2r0000s60hh7sox0qx	bret.williams@shopify.com	bret.williams	https://www.gravatar.com/avatar/b90d180d9729118174c9350606910379	bret.williams
cmay5dnrq0000s60hwq31yjy0	insiya.kanjee@shopify.com	insiya.kanjee	https://www.gravatar.com/avatar/853db9cef030013f37f92e92c44bb6c9	insiya.kanjee
cmay867m80000s60hb9j42yrw	ben.sehl@shopify.com	ben.sehl	https://www.gravatar.com/avatar/4d12370a92032708d043b4ca347ec7b5	ben.sehl
cmay8awdu0001s60hd92lg9vs	alessandro.dalgrande@shopify.com	alessandro.dalgrande	https://www.gravatar.com/avatar/73f81d13a73bdd994742a014458a74e4	alessandro.dalgrande
cmay8r5l80002s60h26t7ofj6	thomas.marcucci@shopify.com	thomas.marcucci	https://www.gravatar.com/avatar/c05474fdeb9bde1c7946323548c4bc0d	thomas.marcucci
cmay907wa0003s60h7kr6cr4v	gil.greenberg@shopify.com	gil.greenberg	https://www.gravatar.com/avatar/329753504d4bb2473f6ce364baaacd4e	gil.greenberg
cmayas4m80000s60hak1nw5k4	katie.laliberte@shopify.com	katie.laliberte	https://www.gravatar.com/avatar/998bb2bdecec4011910b94a2affc9cc8	katie.laliberte
cmaycywci0000s60httoy8c09	dave.nagoda@shopify.com	dave.nagoda	https://www.gravatar.com/avatar/982b33b54ffaf0c4a026f5b73dfc5a4a	dave.nagoda
cmayisi5m0000s60hf4qjo0x9	anna.safronova@shopify.com	anna.safronova	https://www.gravatar.com/avatar/b2efaa675b1b2d4d7ef6f629e749ebdb	anna.safronova
cmazlmkwr0000s60hgg33fwxi	mark.trinidad@shopify.com	mark.trinidad	https://www.gravatar.com/avatar/7d9466b369529714e52f6bd727ce3bff	mark.trinidad
cmazmkysl0000s60hp78pta2s	katie.knecht@shopify.com	katie.knecht	https://www.gravatar.com/avatar/d42ea17747e0a376c292fb93a24da8e5	katie.knecht
cmazoov6r0000s60h21m7qyx7	taylor.reddamwoo@shopify.com	taylor.reddamwoo	https://www.gravatar.com/avatar/63d6973ec1543b5421774df085a976f9	taylor.reddamwoo
cmaztncpn0000s60h4qitcgto	emaline.gayhart@shopify.com	emaline.gayhart	https://www.gravatar.com/avatar/f05e9e7680e718990de09dde8deb6515	emaline.gayhart
cmb0yqxlc0000s60h65c5h7ff	shams.haroon@shopify.com	shams.haroon	https://www.gravatar.com/avatar/1f02bfb51928270ff47c6e99af161eab	shams.haroon
cmb5grl6d0000s60h9uvfd6ug	mark.frazier@shopify.com	mark.frazier	https://www.gravatar.com/avatar/122246bd34629d51365c696efe6a3b43	mark.frazier
cmb75a3em0000s60hy5kjpbxr	annabel.jones@shopify.com	annabel.jones	https://www.gravatar.com/avatar/5febac66941eb0550b11e4bba2f1898b	annabel.jones
cmb7vffvn0000s60hfqwctm18	namrata.suri@shopify.com	namrata.suri	https://www.gravatar.com/avatar/d7d2330e6e86485e71416f88c4ab4f16	namrata.suri
cmb7wxtvu0000s60hj4y40fun	ben.hoxie@shopify.com	ben.hoxie	https://www.gravatar.com/avatar/e914eabf4655875501d7c63ad40fd74f	ben.hoxie
cmb7x0tsg0001s60hq8uzn456	alex.page@shopify.com	alex.page	https://www.gravatar.com/avatar/4df1ea27146855f3c16a2228f94dcc77	alex.page
cmb7xfdd30002s60ho2xxkl1w	galen.king@shopify.com	galen.king	https://www.gravatar.com/avatar/b1d66f6f8b5e73f034864051e5d196ac	galen.king
cmb7xn1qx0003s60hgenklg7f	josh.sanger@shopify.com	josh.sanger	https://www.gravatar.com/avatar/c2eb8bf8dee63f2b83848ccc42d4c64a	josh.sanger
cmb7xxoim0004s60hwre0o6ux	jed.piezas@shopify.com	jed.piezas	https://www.gravatar.com/avatar/731dd927c7891457f98a9f0ad595dd10	jed.piezas
cmb7xzn3e0005s60h0zv7ei1f	robin.somlette@shopify.com	robin.somlette	https://www.gravatar.com/avatar/0a389e0afce8b321e2fc4f8be452ffd2	robin.somlette
cmb7yim3w0006s60h9ab2mnq9	larissa.filice@shopify.com	larissa.filice	https://www.gravatar.com/avatar/8ac7c3718c84d6475e8eaf301c63f371	larissa.filice
cmb7z8akg0007s60he7xw7iyj	andy.polhill@shopify.com	andy.polhill	https://www.gravatar.com/avatar/4c5af89aa1b052a9f090c6e82abb52fd	andy.polhill
cmb7z96bv0008s60hqsze84r0	martin.samson@shopify.com	martin.samson	https://www.gravatar.com/avatar/45b2cc9199940ce64a0b6ff96b1647e0	martin.samson
cmb810ct50000s60hvmpoc7g0	chad.cole@shopify.com	chad.cole	https://www.gravatar.com/avatar/0ad56370635cf7439856b0d93d774a2d	chad.cole
cmb816cc30001s60h22906vu8	omair.ahmed@shopify.com	omair.ahmed	https://www.gravatar.com/avatar/e5ce859fccd9670add6fea628c53a750	omair.ahmed
cmb81r39s0002s60hg5ymyoid	brian.berzellini@shopify.com	brian.berzellini	https://www.gravatar.com/avatar/796030a9297b07ce215f76329f36a1c1	brian.berzellini
cmb81v8ut0003s60h0l5xnquo	michael.lee@shopify.com	michael.lee	https://www.gravatar.com/avatar/fdc543518135c7b10a2b92101edbd50b	michael.lee
cmb8bm71q0000s60hr6pj95dl	rohini.palliyali@shopify.com	rohini.palliyali	https://www.gravatar.com/avatar/df32017a14618088283b707c5848bcc5	rohini.palliyali
cmb9jfv3s0000s60haohaacp6	victoria.wong@shopify.com	victoria.wong	https://www.gravatar.com/avatar/db44b140c5c71a19708908ea57c05f81	victoria.wong
cmb9w0o1b0000s60hmouhcs2e	ates.goral@shopify.com	ates.goral	https://www.gravatar.com/avatar/acea7d4dec0321d3d1e14e81118259b7	ates.goral
cmbb2cuxf0000s60hqi4fr8ki	jon.french@shopify.com	jon.french	https://www.gravatar.com/avatar/0dc517146a1661b92cfe460412df492f	jon.french
cmbb73w2a0000s60h1voeqx5y	kelly.jepsen@shopify.com	kelly.jepsen	https://www.gravatar.com/avatar/e4e3b59c5a013ff99785ea1234a70a55	kelly.jepsen
cm8hvl42z0004s60h4v1352m9	cam.schultheis@shopify.com	cam.schultheis	https://www.gravatar.com/avatar/c8cbb1223c403983fc32d96943eee5ad	cam.schultheis
cmbfgw2nx0000s60hf54blaox	josh.machado@shopify.com	josh.machado	https://www.gravatar.com/avatar/506766e30d0326ab6b4f18170ce00505	josh.machado
cmbgw820m0000s60h9y9t81x0	shar.halaldeen@shopify.com	shar.halaldeen	https://www.gravatar.com/avatar/4d3661f4a803e72605481633e3e64f6e	shar.halaldeen
cmbgwhrpu0001s60hjfkq08gm	kimball.denetso@shopify.com	kimball.denetso	https://www.gravatar.com/avatar/e79ce55ef489148c3522fe88283a9637	kimball.denetso
cmbi1jm2t0000s60hypb3l0ws	toby.barnes@shopify.com	toby.barnes	https://www.gravatar.com/avatar/d78fd748d91043046fff5ce71614c24a	toby.barnes
cmbi8jswz0000s60hewx232ms	blake.stevenson@shopify.com	blake.stevenson	https://www.gravatar.com/avatar/9838049821b49de2ad4eafe34d390ef1	blake.stevenson
cmbihylqd0000s60hmn0j1vq1	nikki.betuel@shopify.com	nikki.betuel	https://www.gravatar.com/avatar/2e58e3fd36625cacca81d4e30c8efac0	nikki.betuel
cmbiom94g0000s60hscpw0b40	kyle.cogger@shopify.com	kyle.cogger	https://www.gravatar.com/avatar/70479d06b968c0d394e8101ee12ac064	kyle.cogger
cmbtmq8f50000s60havk5nbo9	james.d.thomas@shopify.com	james.d.thomas	https://www.gravatar.com/avatar/09fe0c152a5f7aabb9a06a396f977203	james.d.thomas
cmc9jbib90000s60hjpmehu4z	vineet.kumar@shopify.com	vineet.kumar	https://www.gravatar.com/avatar/0c1039fee2a919606e1c05ab48c6ae08	vineet.kumar
cmcngmirj0000s60h8z7wjw5c	arushi.singh@shopify.com	arushi.singh	https://www.gravatar.com/avatar/aab2b465a879374ff744295873c80263	arushi.singh
cmcx2ab2u0000s60ha9a9ypgb	peter.trizuliak@shopify.com	peter.trizuliak	https://www.gravatar.com/avatar/1f0161c85994dd2c031f90b9f750d22b	peter.trizuliak
cmcxkhoqy0000s60hlltrg465	erin.lannan@shopify.com	erin.lannan	https://www.gravatar.com/avatar/34a63734c09d0bdf58fa3f1afafd04ca	erin.lannan
cmcxt4z580000s60hrdso5nk6	madeleine.kennedy@shopify.com	madeleine.kennedy	https://www.gravatar.com/avatar/d3c5a38fcd828adbc18c76afd992c671	madeleine.kennedy
cmcz8vidc0000s60h5riblru3	sophia.deng@shopify.com	sophia.deng	https://www.gravatar.com/avatar/75b2f52a7819fc98a319d918fa3d86db	sophia.deng
cmd37t3a20000s60hv6c0g4ru	kyle.brumm@shopify.com	kyle.brumm	https://www.gravatar.com/avatar/6f4ed611f65ced62a949cedf9fdb06a0	kyle.brumm
cmd3kfpnf0000s60h5n4luw1u	david.misshula@shopify.com	david.misshula	https://www.gravatar.com/avatar/9d92e8a584bfc725b38b3b82e0c33146	david.misshula
cmd4nbvn20000s60h66347bvf	joe.letchford@shopify.com	joe.letchford	https://www.gravatar.com/avatar/9c7a3b9d383219d548e6a2a7e8b55c05	joe.letchford
cmd6eval70000s60ht96ovxum	mac.huynh@shopify.com	mac.huynh	https://www.gravatar.com/avatar/4f74c3183cd24e42a14396eb390deba9	mac.huynh
cmd7trw9s0000s60h5bp11nk5	adit.daga@shopify.com	adit.daga	https://www.gravatar.com/avatar/c474a93bfd4bb44226a77552b2d4764a	adit.daga
cmdg1je250000s60hkz2np533	dan.peach@shopify.com	dan.peach	https://www.gravatar.com/avatar/ca657737ed378fb05864f734bd275a32	dan.peach
cmdnl3d160000s60hyn1wjume	graeme.kemp@shopify.com	graeme.kemp	https://www.gravatar.com/avatar/4d5ff136ecfbd45ebd1b5beebd0ad830	graeme.kemp
cmdnl6z8b0001s60h375butif	misha.korablin@shopify.com	misha.korablin	https://www.gravatar.com/avatar/4624c55a7c7fdfb07e65336710f5ae4d	misha.korablin
cmdotyo0g0000s60ho5wnc4mt	claudia.santos@shopify.com	claudia.santos	https://www.gravatar.com/avatar/c1216ddacf15c2716a611c7864721b1e	claudia.santos
cmdriac0i0000s60hal5rcnf4	ishani.ghosh@shopify.com	ishani.ghosh	https://www.gravatar.com/avatar/8aa8870b95158deffe5657dd87f231b4	ishani.ghosh
cmdrnakfa0000s60hnmefx81d	niree.perian@shopify.com	niree.perian	https://www.gravatar.com/avatar/de4f323bf4ac259197d84f50937908d1	niree.perian
cmdrw41950000s60hyga8i1np	xiaodong.fan@shopify.com	xiaodong.fan	https://www.gravatar.com/avatar/46fa4e5a4d2fe4bae2270dea8a873f7f	xiaodong.fan
cmdrw8liu0001s60h484skper	john.datserakis@shopify.com	john.datserakis	https://www.gravatar.com/avatar/e96ca3ed669962d7b1e74a82e2da8a83	john.datserakis
cmdt18lqp0000s60hnt8gw9q2	chris.maltais@shopify.com	chris.maltais	https://www.gravatar.com/avatar/bed649c79fa37a5fbddd6da42c6716df	chris.maltais
cmdt1bngv0001s60h54us033p	matt.colyer@shopify.com	matt.colyer	https://www.gravatar.com/avatar/5526103ab0985e4e098729050031305b	matt.colyer
cmdt2ktmx0002s60hxwxkkzyk	qiuzao.zhang@shopify.com	qiuzao.zhang	https://www.gravatar.com/avatar/310617eb48c98403e19b561bedaa8138	qiuzao.zhang
cm8ysolaf0000s60h165ztlk4	patrick.smith@shopify.com	patrick.smith	https://www.gravatar.com/avatar/7eb5233bddab65aae729c876011ee1dd	patrick.smith
cmapmfqcc0000s60h0z2sqlo2	cynthia.savardsaucier@shopify.com	CSS	https://www.gravatar.com/avatar/5123550a007c3df342374ff0375b59d2	cynthia.savardsaucier
cmdyicx4a0000s60he0alb1x5	christian.mair@shopify.com	christian.mair	https://www.gravatar.com/avatar/844d7cf9d5455e736bdc300721507410	christian.mair
cmdyo6fzs0000s60h239v4tsw	michelle.tampoya@shopify.com	michelle.tampoya	https://www.gravatar.com/avatar/98b3b2bf91c008d4d26f36c587fff0b7	michelle.tampoya
cme03g0ep0000s60hjphwn3i0	chelsea.rudderham@shopify.com	chelsea.rudderham	https://www.gravatar.com/avatar/e8c4dafae85c2b11727618832bf76593	chelsea.rudderham
cmebuly2c0000s60hr2fuz4ky	jax.hodgkinson@shopify.com	jax.hodgkinson	https://www.gravatar.com/avatar/e9d3666ce63e39adb9fb5e46695dbadf	jax.hodgkinson
cmebum4nd0001s60hpgtk0nz0	dan.rosenthal@shopify.com	dan.rosenthal	https://www.gravatar.com/avatar/daa4077c39250eecfcaad8d0d3e68cd6	dan.rosenthal
cmebumaca0002s60hmqnpi443	richard.shaw@shopify.com	richard.shaw	https://www.gravatar.com/avatar/908b0b1fa800e9f645dfdabb8c14b7f8	richard.shaw
cmebumavo0003s60hbxcxo27d	andrew.dunbar@shopify.com	andrew.dunbar	https://www.gravatar.com/avatar/b548e9502503782e9a38cf3c39b36a71	andrew.dunbar
cmebumbt90004s60hucrtl8jc	nichol.alexander@shopify.com	nichol.alexander	https://www.gravatar.com/avatar/91b5615802d356165b3bf004349a2985	nichol.alexander
cmebumc3c0005s60hod6dmc9o	gabriel.dubois@shopify.com	gabriel.dubois	https://www.gravatar.com/avatar/3685dbec428be87b82a2c944b7059bba	gabriel.dubois
cmebumq2e0008s60h7tktj5e5	vibhor.malik@shopify.com	vibhor.malik	https://www.gravatar.com/avatar/a816efd6f43c82e3e71e2bdff2763ab5	vibhor.malik
cmebv415u000rs60h42wom3gm	ronnie.leblanc@shopify.com	ronnie.leblanc	https://www.gravatar.com/avatar/c5cc069d09df3833f6e086c867e34679	ronnie.leblanc
cmebv7x5s000ws60hcp82r68g	kouros.falati@shopify.com	kouros.falati	https://www.gravatar.com/avatar/4ef951a89d8249b15870b51414fd5621	kouros.falati
cmebyk1m4001os60hv7axp2sr	stijn.heymans@shopify.com	stijn.heymans	https://www.gravatar.com/avatar/f265705788e6c00b2c17b2eef6faf961	stijn.heymans
cmecmghd6000as60hcxa6y1l9	mladjan.mihajlovic@shopify.com	mladjan.mihajlovic	https://www.gravatar.com/avatar/a95dd881835927e82fe73d9b406647c8	mladjan.mihajlovic
cmecz5r61000gs60hho6weecr	anam.shaikh@shopify.com	anam.shaikh	https://www.gravatar.com/avatar/8a821e276147b751c77456b80417715f	anam.shaikh
cmeha0kdd0006s60hbmimx2ta	erin.upton@shopify.com	erin.upton	https://www.gravatar.com/avatar/052786a6329f3049c766f12c337c20d6	erin.upton
cmerto0r10000s60huked8pza	natalie.hercun@shopify.com	natalie.hercun	https://www.gravatar.com/avatar/ec04624ce1991bf4808574689ac11cb7	natalie.hercun
cmfe9v16t0000s60hn97kg1am	nicole.proulx@shopify.com	nicole.proulx	https://www.gravatar.com/avatar/7acb70c5bb218e19c76cf3ed5c6c92ea	nicole.proulx
cmg3uh5ey0000s60hkudgjgfc	leah.gale@shopify.com	leah.gale	https://www.gravatar.com/avatar/e0cdb67729f90ea2356fd9b3840cdb60	leah.gale
cmebume6k0006s60hmunhtra3	hassan.rehman@shopify.com	hassan.rehman	https://www.gravatar.com/avatar/8a8ceae0804f5360bdc0e73beb1d5729	hassan.rehman
cmebupibv000as60h7oaoifiw	savannah.mitchell@shopify.com	savannah.mitchell	https://www.gravatar.com/avatar/95d4e143873f26e123b37e1430cc54f3	savannah.mitchell
cmebv597y000ss60haj6vuwyd	rezaan.syed@shopify.com	rezaan.syed	https://www.gravatar.com/avatar/36b93fdcf0a471ba8e89a0132c850450	rezaan.syed
cmebyu87j001ps60h13y5v30v	henry.stelle@shopify.com	henry.stelle	https://www.gravatar.com/avatar/09c41c597f4141c0659b24667bfeb900	henry.stelle
cmebyviym001qs60ha6i78f6f	ariel.caplan@shopify.com	ariel.caplan	https://www.gravatar.com/avatar/8c3cad9e07567f46739baed9778f4313	ariel.caplan
cmecmtn04000bs60hsx6fduub	assunta.walderdorff@shopify.com	assunta.walderdorff	https://www.gravatar.com/avatar/509de2fb6c4e32dee4edac3b004b3998	assunta.walderdorff
cmeczjtex000hs60hfti7ac14	john.turco@shopify.com	john.turco	https://www.gravatar.com/avatar/b59b69339f3922ef7b368fad4b0300a7	john.turco
cmeha9ug30007s60hw68b24wp	elka.looks@shopify.com	elka.looks	https://www.gravatar.com/avatar/843207f4963243fb6b542d86819a380d	elka.looks
cmesrvsa80000s60h7z430cio	justas.gaubys@shopify.com	justas.gaubys	https://www.gravatar.com/avatar/6c5811acf100f111e90e68c61df07f7d	justas.gaubys
cmf2kjlm80000s60hgys7255w	tiffany.ip@shopify.com	tiffany.ip	https://www.gravatar.com/avatar/a3de9fbf2336883ec5bf80201953ee5e	tiffany.ip
cmfeb7aaa0000s60h23rp1biu	julia.kranjac@shopify.com	julia.kranjac	https://www.gravatar.com/avatar/b9ae566166da78abf492a596761abea5	julia.kranjac
cmg6lbo0k0000s60h0lkdgzaf	scott.birksted@shopify.com	scott.birksted	https://www.gravatar.com/avatar/37f5d297f38c91f47b5b1a4f6366857f	scott.birksted
cmhmmdszt0000s60h0ukqdikn	max.yinger@shopify.com	max.yinger	https://www.gravatar.com/avatar/15a8187ab803625fc81dcbc6cb2997e5	max.yinger
cmebumnsh0007s60hkcahv7e0	roque.pinel@shopify.com	roque.pinel	https://www.gravatar.com/avatar/822be125f08966581ab312e3dc80d92b	roque.pinel
cmebv657b000ts60hd2ulc1uq	allison.malloy@shopify.com	allison.malloy	https://www.gravatar.com/avatar/053ceb013335ba2675e141e04c7a7577	allison.malloy
cmebyxbho001rs60htn9jntcn	jamesk.lee@shopify.com	jamesk.lee	https://www.gravatar.com/avatar/d95a13332b4fe5aa4b14bb4fd94de97b	jamesk.lee
cmecnh3ww0000s60h9qvu6hkh	zishan.ashraf@shopify.com	zishan.ashraf	https://www.gravatar.com/avatar/d733b541fd5f61cc33c3b68877969f41	zishan.ashraf
cmeczpmku000ns60hsllfg8vo	will.mills@shopify.com	will.mills	https://www.gravatar.com/avatar/4cb938b0f7c5505a211dd3f8eeec070d	will.mills
cmehagh0a0008s60hefi36534	dayna.winter@shopify.com	dayna.winter	https://www.gravatar.com/avatar/dadc1475f532c7524a6318b68555495a	dayna.winter
cmesu9lp50000s60h860knyfj	phiroze.noble@shopify.com	phiroze.noble	https://www.gravatar.com/avatar/ae229081c9f00d66a2fd49a7a7b72476	phiroze.noble
cmf2pv05o0000s60hm4lv2rr5	kyle.waldrop@shopify.com	kyle.waldrop	https://www.gravatar.com/avatar/bd8d605a3f90ecfa82a89f6150c92c03	kyle.waldrop
cmfgyahho0000s60hiswt6irh	jaryd.diamond@shopify.com	jaryd.diamond	https://www.gravatar.com/avatar/8c730e3833297e820b93a0e461d49dec	jaryd.diamond
cmg6skl4r0000s60huaqd6kf8	courtney.symons@shopify.com	courtney.symons	https://www.gravatar.com/avatar/068cc4357897fd3ffcc2ae59d92f52b5	courtney.symons
cmhpblr0n0009s60hfwbx3zd6	richard.penner@shopify.com	richard.penner	https://www.gravatar.com/avatar/6952043cb654be01b7f935f49f6c7802	richard.penner
cmebuo0il0009s60h5a7sde7b	octav.druta@shopify.com	octav.druta	https://www.gravatar.com/avatar/840f56e4065b20de8bb590d50a2652d0	octav.druta
cmeburzer000ds60hzqs3fx60	vanessa.lee@shopify.com	vanessa.lee	https://www.gravatar.com/avatar/cfd6150d8f5508ec6faadfc39892dec4	vanessa.lee
cmebus903000es60hh1ebpifv	daniel.beauchamp@shopify.com	daniel.beauchamp	https://www.gravatar.com/avatar/c54e76d2a8908b68d73f73485a540855	daniel.beauchamp
cmebusfvp000fs60hxbrgk80p	david.small@shopify.com	david.small	https://www.gravatar.com/avatar/318fdfb9c738821ab1c8aef3b4bb40e1	david.small
cmebushn0000gs60hax5yle0b	justin.harris@shopify.com	justin.harris	https://www.gravatar.com/avatar/f8dee58161ebe23c5d5086eadcf929d4	justin.harris
cmebusign000hs60hob81ofp7	venkat.prabhu@shopify.com	venkat.prabhu	https://www.gravatar.com/avatar/88b0b00270a401ba5120c236a56b49cd	venkat.prabhu
cmebusj1u000is60hjj0g5cn9	rune.madsen@shopify.com	rune.madsen	https://www.gravatar.com/avatar/e1d8d165a7de2e787a5bbac5da127fb0	rune.madsen
cmebusj1x000js60h4dvqqbe9	drew.owen@shopify.com	drew.owen	https://www.gravatar.com/avatar/ec339790c7d18d1e726b15a0c94c211c	drew.owen
cmebusm160000s60hlxz2hczk	ben.lafferty@shopify.com	ben.lafferty	https://www.gravatar.com/avatar/5292962dd66746724b05384dc933efe0	ben.lafferty
cmebusm4u0000s60h9211bu5x	omar.shalash@shopify.com	omar.shalash	https://www.gravatar.com/avatar/a8ab44a6195de256926e8b704b0ad907	omar.shalash
cmebusm83000ks60h0njnl2oy	justtin.hoang@shopify.com	justtin.hoang	https://www.gravatar.com/avatar/f755d60350de899cc5fbba0a7b91ca85	justtin.hoang
cmebusmek000ls60himvagfn6	joe.holston@shopify.com	joe.holston	https://www.gravatar.com/avatar/96ee2b9cbc3573494912f4c94359bb50	joe.holston
cmebusmnj0000s60o4651pqwf	pedro.baracho@shopify.com	pedro.baracho	https://www.gravatar.com/avatar/6e0c1a772b4c7d933188076aead34c12	pedro.baracho
cmebusmsf000ms60hkc2dth14	durga.sivakumar@shopify.com	durga.sivakumar	https://www.gravatar.com/avatar/223ba784d0c97a31423768dde2a1cbda	durga.sivakumar
cmebusmxj000ns60hcwu134ua	joel.gerber@shopify.com	joel.gerber	https://www.gravatar.com/avatar/8f32cc90cf415105343c98d666448286	joel.gerber
cmebusn6j000os60hls7nj0aj	andy.ury@shopify.com	andy.ury	https://www.gravatar.com/avatar/b81d8ea8fb15371f13a75ceb355f2c30	andy.ury
cmebusncw000ps60hg71x7b27	keegan.tennant@shopify.com	keegan.tennant	https://www.gravatar.com/avatar/aaad21bb6c6ed46b1e7ca617e759b6f7	keegan.tennant
cmebusnk60001s60hu5bidqge	jeff.kantarek@shopify.com	jeff.kantarek	https://www.gravatar.com/avatar/e590bcb1c919af7debb84c7810c587f4	jeff.kantarek
cmebusnr0000qs60hk4ak9356	peter.lazzarino@shopify.com	peter.lazzarino	https://www.gravatar.com/avatar/53b0339bb8bef09e2a26d626a65937e8	peter.lazzarino
cmebuso4w000rs60hbea7p2oa	matt.koenig@shopify.com	matt.koenig	https://www.gravatar.com/avatar/6619cb1f36537118507f5040f38dfb84	matt.koenig
cmebuso5h000ss60hv6bystx5	travis.a.smith@shopify.com	travis.a.smith	https://www.gravatar.com/avatar/47422a2d68aea86a545a15d8430ae744	travis.a.smith
cmebuso9q0001s60hank5frj2	ajanth.uthayan@shopify.com	ajanth.uthayan	https://www.gravatar.com/avatar/36ce3963b96813c0cc3c575c4d2e0664	ajanth.uthayan
cmebusok4000ts60hdzoxh939	noah.simpson@shopify.com	noah.simpson	https://www.gravatar.com/avatar/0fcd4e9f89b24ea199cfcaa0f90d3006	noah.simpson
cmebusokn000us60hueo7u37n	thomas.fung@shopify.com	thomas.fung	https://www.gravatar.com/avatar/1e85660db8fb75552ae305dc8a8a654f	thomas.fung
cmebusols000vs60hk3j00i1p	chris.peddecord@shopify.com	chris.peddecord	https://www.gravatar.com/avatar/0ce86415fa24c00baf18d8c73e9109b5	chris.peddecord
cmebusonx000ws60hobtwwj60	bharat.surampalli@shopify.com	bharat.surampalli	https://www.gravatar.com/avatar/45cb8e2ceef679f22312256f9591ef5b	bharat.surampalli
cmebusots000xs60hzivnhmyw	matthew.tanous@shopify.com	matthew.tanous	https://www.gravatar.com/avatar/90e93289ce4f1b954d08f9f495f39fdd	matthew.tanous
cmebusovy000ys60h15gcz1fx	joey.tedeschi@shopify.com	joey.tedeschi	https://www.gravatar.com/avatar/cba3720c2024f58df71cde11d827ab2e	joey.tedeschi
cmebusow0000zs60h2pw0tyvn	liam.butler@shopify.com	liam.butler	https://www.gravatar.com/avatar/f4b7774bac6a6ae8d00202311412f060	liam.butler
cmebusoy50000s60hka457uwv	zach.mathew@shopify.com	zach.mathew	https://www.gravatar.com/avatar/70eda69d7ce0f4c9af8833d1604331d3	zach.mathew
cmebusp3v0010s60hj6hz3hbn	chris.sweeney@shopify.com	chris.sweeney	https://www.gravatar.com/avatar/50427cd28be43f662849ab48773a87c5	chris.sweeney
cmebusp4l0011s60h0hnkw1qd	amol.patil@shopify.com	amol.patil	https://www.gravatar.com/avatar/48f1abdfb28d28b6effc4cce32c9da22	amol.patil
cmebusp8y0012s60hlibs2nog	evan.eklund@shopify.com	evan.eklund	https://www.gravatar.com/avatar/3c12f909615bb5e5781876d5526a8f91	evan.eklund
cmebuspda0013s60had76kony	alexa.whitney@shopify.com	alexa.whitney	https://www.gravatar.com/avatar/bd3e010b9ed9c552f72ad20d510f1ca1	alexa.whitney
cmebuspo10001s60o2yg505ha	phil.egelston@shopify.com	phil.egelston	https://www.gravatar.com/avatar/d7a705411ddedb1551684aacc42eaa2d	phil.egelston
cmebuspol0014s60h0gcidrul	chris.dakin@shopify.com	chris.dakin	https://www.gravatar.com/avatar/7f52e99e2b4c3e879bcee2b3de3af360	chris.dakin
cmebusppi0002s60h615utpfu	phil.sung@shopify.com	phil.sung	https://www.gravatar.com/avatar/6d05b15c35abbf125d7b73e252d28854	phil.sung
cmebuspta0015s60hg147hq3a	alex.pilon@shopify.com	alex.pilon	https://www.gravatar.com/avatar/ea221bc35e4dbbe2daa9cef71823f246	alex.pilon
cmebuspzd0003s60hqyuguz3x	philippe.bourdages@shopify.com	philippe.bourdages	https://www.gravatar.com/avatar/23bb07cc96b64d6f7887c41b622d04aa	philippe.bourdages
cmebusq520002s60o0drx0o9o	leon.l.zhang@shopify.com	leon.l.zhang	https://www.gravatar.com/avatar/99ea9917d7877766b75520e7e342aa41	leon.l.zhang
cmebusq8h0001s60hudnotl2t	craig.dykstra@shopify.com	craig.dykstra	https://www.gravatar.com/avatar/2e32d6f6c825dde5998cf1da3b88bce7	craig.dykstra
cmebusq9n0016s60hngsx1zt2	jason.addleman@shopify.com	jason.addleman	https://www.gravatar.com/avatar/bf7cebb91303b9455e9148fc7f3223eb	jason.addleman
cmebusqg90003s60omh526lxz	jesse.hoffman@shopify.com	jesse.hoffman	https://www.gravatar.com/avatar/1c4ebe16815afc04ce3f4f6184d74a90	jesse.hoffman
cmebusqtg0017s60hqz8gl2kk	sebastian.alvarado@shopify.com	sebastian.alvarado	https://www.gravatar.com/avatar/1cdb77b49c23731690f4bba152042499	sebastian.alvarado
cmebv7t74000us60hppkrl420	ellen.dunne@shopify.com	ellen.dunne	https://www.gravatar.com/avatar/4b970cc584cf83781a01cd31925ae3bb	ellen.dunne
cmebusr320019s60hfiksakyp	sohan.jain@shopify.com	sohan.jain	https://www.gravatar.com/avatar/aa55991091d3c8202b9e35fe2b21a0fa	sohan.jain
cmebusr9r001as60hoekcch8b	mujtaba.khambatti@shopify.com	mujtaba.khambatti	https://www.gravatar.com/avatar/7528badc71c9c771249a574db823f21e	mujtaba.khambatti
cmebusran0002s60hq3f3jljn	scott.sundblade@shopify.com	scott.sundblade	https://www.gravatar.com/avatar/24736927bab4a28a55327c027f5b69bd	scott.sundblade
cmebusrbu0002s60hpm450zyl	josh.beckman@shopify.com	josh.beckman	https://www.gravatar.com/avatar/2e0002de0067e0449a2a7200f007d8b9	josh.beckman
cmebusrfw0004s60ofpyqcz4r	nash.collins@shopify.com	nash.collins	https://www.gravatar.com/avatar/bf75a019dd952c20ae3c57d073533eb6	nash.collins
cmebussil001bs60hj05mpfxs	george.zanetti@shopify.com	george.zanetti	https://www.gravatar.com/avatar/c9f7e2a9b62cf10b7522d06203b117d3	george.zanetti
cmebussiz0006s60otg83qgac	rahul.sachan@shopify.com	rahul.sachan	https://www.gravatar.com/avatar/74dd723e4b3d02849cf1c522ae2e1f0c	rahul.sachan
cmebusuzg0005s60hnnv1cyk5	cristan.brown@shopify.com	cristan.brown	https://www.gravatar.com/avatar/3377ca617e100a94b97771f80e70dfc1	cristan.brown
cmebusvhi001os60h0pe1xtfp	andrew.evershed@shopify.com	andrew.evershed	https://www.gravatar.com/avatar/bf1311834f7ed9919a8d95c558886d35	andrew.evershed
cmebusvla001ps60hzdv3gqyj	jackson.foster@shopify.com	jackson.foster	https://www.gravatar.com/avatar/a0b8a70f5cda53deacd05f9fd69b75d0	jackson.foster
cmebuswk30006s60hiyldicad	bedi.egilmez@shopify.com	bedi.egilmez	https://www.gravatar.com/avatar/baf2aa0f2f61d9afd5696c89a0e45fff	bedi.egilmez
cmebuswkr0007s60h362r8fmd	louis.mccracken@shopify.com	louis.mccracken	https://www.gravatar.com/avatar/f9b158df8449b5dd3cc6abaa505dc4ae	louis.mccracken
cmebusxuw001ts60hlw73tx3j	ryan.pastorelle@shopify.com	ryan.pastorelle	https://www.gravatar.com/avatar/5e89c3f29d690bd08ebdc08b0bdbccdc	ryan.pastorelle
cmebusyao000as60odsdny6do	akhil.prabhakaran@shopify.com	akhil.prabhakaran	https://www.gravatar.com/avatar/0dc7eada748c17e67599c11ed8612158	akhil.prabhakaran
cmebusz7e001xs60hglll2gkd	oksana.azarova@shopify.com	oksana.azarova	https://www.gravatar.com/avatar/d5ba6a5c5ff675ffda31737f81bec4ac	oksana.azarova
cmebut0xp000as60hvtc5ds7v	mark.appleby@shopify.com	mark.appleby	https://www.gravatar.com/avatar/76bb84a02120eafd1793d5dc4cd13750	mark.appleby
cmebut1ar0024s60hzphq0ghd	sidney.macdougall@shopify.com	sidney.macdougall	https://www.gravatar.com/avatar/88e3d3c1a65b3ecf5cc7d8942db0fff1	sidney.macdougall
cmebut62u000ds60h13cur3qj	silvia.hayden@shopify.com	silvia.hayden	https://www.gravatar.com/avatar/b71644768c602c60623a61ed59aadfa2	silvia.hayden
cmebut7nl002es60h7n9n59j9	nick.nehaul@shopify.com	nick.nehaul	https://www.gravatar.com/avatar/b7426b1fc55fd20a7a3f4178ca35e7eb	nick.nehaul
cmebut9q9000is60hl1edgzeh	adam.shepley@shopify.com	adam.shepley	https://www.gravatar.com/avatar/72a5e550a91dfbe774a0f983b6c2f6cb	adam.shepley
cmebutcir002ms60hgkqj9fnf	emilee.sorrey@shopify.com	emilee.sorrey	https://www.gravatar.com/avatar/9b2352c17ebe62e9f211c24be79e9c04	emilee.sorrey
cmebv7vq5000vs60h866okmpi	josh.zucker@shopify.com	josh.zucker	https://www.gravatar.com/avatar/86b2893e883ad35d2924c6df57f64a97	josh.zucker
cmebz1m0s001ss60hwejyqi1n	christopher.cruz@shopify.com	christopher.cruz	https://www.gravatar.com/avatar/91daf3d6c0732e746c7c5fe0415a301f	christopher.cruz
cmecnv3tu0001s60hc1rs2izz	loughlin.mcsweeney@shopify.com	loughlin.mcsweeney	https://www.gravatar.com/avatar/d4f365cf8844d51f53f9e5a267a3f749	loughlin.mcsweeney
cmed16vi2000os60hdoyvjft1	brendan.harte@shopify.com	brendan.harte	https://www.gravatar.com/avatar/70bab9adf972e7694c9962bf022a6a05	brendan.harte
cmehbjfwi0009s60heow42lrt	dave.rosstomlin@shopify.com	dave.rosstomlin	https://www.gravatar.com/avatar/a5cc29f9cd6c9b6c9313b45f9bfc5249	dave.rosstomlin
cmesu9pv30001s60h8qoi0k7a	charlie.dobson@shopify.com	charlie.dobson	https://www.gravatar.com/avatar/5ff1e8bc7dfb3ca1356fb1e27916e04a	charlie.dobson
cmf2s77ce0000s60haylgbpg3	yael.bienenstock@shopify.com	Yaël Bienenstock	https://www.gravatar.com/avatar/65565f61d4b712ae67404f27018ba63a	yael.bienenstock
cmfgydq710001s60h8y09ntth	mori.ahmadi@shopify.com	mori.ahmadi	https://www.gravatar.com/avatar/381baa8e16bd1c000b2be3f338fb37eb	mori.ahmadi
cmhpc0sjt000ds60hrdyn3tn7	amy.conroy@shopify.com	amy.conroy	https://www.gravatar.com/avatar/a23e6ac6975668f624e2e6f8e61c4a74	amy.conroy
cmebuss2k0005s60odc38hyw0	hamza.dincer@shopify.com	hamza.dincer	https://www.gravatar.com/avatar/3fbcf0a128d6526a62e681d2d5340d0d	hamza.dincer
cmebussau0003s60hvja9rlpg	nam.pham@shopify.com	nam.pham	https://www.gravatar.com/avatar/fbefd3d1ac65da75899a037422d1dad4	nam.pham
cmebusu9x0007s60oc73qv4on	gerry.huynh@shopify.com	gerry.huynh	https://www.gravatar.com/avatar/6f8feded12df6df613dbfd24a9c14f85	gerry.huynh
cmebuszze0008s60hw41o8zc2	quinn.nguyen@shopify.com	quinn.nguyen	https://www.gravatar.com/avatar/73f12978d79aca317ad200c3488dd3f0	quinn.nguyen
cmebut2kp000bs60hlv04qyht	hannah.paquette@shopify.com	hannah.paquette	https://www.gravatar.com/avatar/264c63f78706b6343799708ce04deb9b	hannah.paquette
cmebut2nf000ds60ouurhihgq	simon.pearson@shopify.com	simon.pearson	https://www.gravatar.com/avatar/a435de2440789f8d580c68a5ec1d6e88	simon.pearson
cmebut4jx000fs60o9y4rjk16	alex.spencer@shopify.com	alex.spencer	https://www.gravatar.com/avatar/7d1d9ac83720f29b17422911793b3dad	alex.spencer
cmebut7p3000gs60hc50qrkst	michelle.shi@shopify.com	michelle.shi	https://www.gravatar.com/avatar/55e02779c9a8bb7c78e36a60731d28fe	michelle.shi
cmebusr2w0018s60hmjg5rr4t	adam.barrus@shopify.com	Adam Barrus	https://www.gravatar.com/avatar/c02fd2334b3e686fc552a6cbe9d8421a	adam.barrus
cmebv8f0t000xs60hqq9hw4dg	sam.jiang@shopify.com	sam.jiang	https://www.gravatar.com/avatar/4be721552e0e78109dc188fabe65de50	sam.jiang
cmebv9tqu000zs60hi5orzlvx	thomas.barton@shopify.com	thomas.barton	https://www.gravatar.com/avatar/b51f753a49a8099e9f16791b7512b58d	thomas.barton
cmebvb0qh0012s60hajaknz9m	levi.smith@shopify.com	levi.smith	https://www.gravatar.com/avatar/274ed4d8fcf6d89e982f726704588c9a	levi.smith
cmebzlinn001ts60hkfg4v6p7	catherine.maciaszek@shopify.com	catherine.maciaszek	https://www.gravatar.com/avatar/2b08a99447619555acb661e8fe4c275d	catherine.maciaszek
cmecofja10002s60ho5mcvx4g	siavash.etemadieh@shopify.com	siavash.etemadieh	https://www.gravatar.com/avatar/270b719f99cb014685d45a82f554e69e	siavash.etemadieh
cmed320u6000ps60hcub2puyd	cecilia.hunka@shopify.com	cecilia.hunka	https://www.gravatar.com/avatar/a92e98f91d90b3e7cc3f94e6a73c2103	cecilia.hunka
cmehedqe90000s60h3xzehlzs	david.cortes@shopify.com	david.cortes	https://www.gravatar.com/avatar/30eda4af89b47755226c43e023262ae8	david.cortes
cmesvowzi0000s60howprfzdi	bryanna.santaromita@shopify.com	bryanna.santaromita	https://www.gravatar.com/avatar/0d32e0be18c59659e5da836436c4852c	bryanna.santaromita
cmf2s9gd70001s60hukozog5m	johnny.slack@shopify.com	johnny.slack	https://www.gravatar.com/avatar/17d1bdf9fdbf0929ad92e9d6d7745b92	johnny.slack
cmf2s9la30004s60hxnfnqget	marvin.schwaibold@shopify.com	marvin.schwaibold	https://www.gravatar.com/avatar/c1e750d4b95a07da4908fc05081ae53d	marvin.schwaibold
cmf2s9nhf0005s60hj97ys717	jesper.vos@shopify.com	jesper.vos	https://www.gravatar.com/avatar/60054e0be263bce5c4c37b5d7799b988	jesper.vos
cmfl3csoa0000s60hsng8ru6f	nigel.swinson@shopify.com	nigel.swinson	https://www.gravatar.com/avatar/fcac041e8a9942a3ce90a9008418e348	nigel.swinson
cmhw3a8jp0000s60hzve139i9	keith.thompson@shopify.com	keith.thompson	https://www.gravatar.com/avatar/95f83f0591215ab271632b0fec92bc54	keith.thompson
cmf2s9kxe0003s60hq1y96kpr	jaytel.provence@shopify.com	Jaytel	https://www.gravatar.com/avatar/2889ff39ad2daf3a6bc5c27381aadd77	jaytel.provence
cm7z93nvr0004s60hcxgjwyln	dust.tevis@shopify.com	dust.tevis	https://www.gravatar.com/avatar/61f19d78f9e77900c336c560bbf9ad91	dust.tevis
cmebussvk001cs60h695bl919	michelle.vinci@shopify.com	michelle.vinci	https://www.gravatar.com/avatar/b54c2b714d299d02e55dac4e7dbaf7d2	michelle.vinci
cmebusu67001ds60h99n9oml1	lucas.moreno@shopify.com	lucas.moreno	https://www.gravatar.com/avatar/3339b178e8c8095a0dcc7071adf855ef	lucas.moreno
cmebusu6r001es60hqwt6q1p8	willie.maddox@shopify.com	willie.maddox	https://www.gravatar.com/avatar/13b6a1583e3b3f7e23cd798ae2022e26	willie.maddox
cmebusu8u001fs60h44b1fxci	dean.vanasseldonk@shopify.com	dean.vanasseldonk	https://www.gravatar.com/avatar/48bb8ad11df8208406beee52f46451a7	dean.vanasseldonk
cmebusvxp001qs60h8g64r8ix	aloka.penmetcha@shopify.com	aloka.penmetcha	https://www.gravatar.com/avatar/f670163873b1dd073b86befbec8ac156	aloka.penmetcha
cmebusxky001ss60hk6wdv6ck	olavo.santos@shopify.com	olavo.santos	https://www.gravatar.com/avatar/a4b6d434136661ed99f7ebab34953fd1	olavo.santos
cmebusztt001zs60ha2hfpccv	anne.liu@shopify.com	anne.liu	https://www.gravatar.com/avatar/a72f204e08bef685ad86f3891541610d	anne.liu
cmebut1u70026s60hcgx6ozzi	kiriana.stukas@shopify.com	kiriana.stukas	https://www.gravatar.com/avatar/d9dab33de57b3c489f4ed933ee840f9b	kiriana.stukas
cmebut42o0029s60h609ch6l1	nikita.ber@shopify.com	nikita.ber	https://www.gravatar.com/avatar/77a3cc7583c27f5c96c062110e4a16b5	nikita.ber
cmebut49s002as60hbthmktto	arman.khashei@shopify.com	arman.khashei	https://www.gravatar.com/avatar/92df598bd7b25f64ff842dce00182553	arman.khashei
cmebut4en002bs60hoezwdklx	bheeshmar.redheendran@shopify.com	bheeshmar.redheendran	https://www.gravatar.com/avatar/6fa8099f66528e5147f884e8643f50a1	bheeshmar.redheendran
cmebut64v002cs60hf52iloyc	juan.jacinto@shopify.com	juan.jacinto	https://www.gravatar.com/avatar/d70d4cff776ea9c054ef853b1aae4747	juan.jacinto
cmebut6ps002ds60hk8ohh7ik	phil.coggins@shopify.com	phil.coggins	https://www.gravatar.com/avatar/00ee301268dc0b4f97392319b5da5e57	phil.coggins
cmebut9ds002fs60hiiqf5usv	peter.rong@shopify.com	peter.rong	https://www.gravatar.com/avatar/2f6c6707069eb4d2ade161c0d3dc4049	peter.rong
cmebutb2z002js60hya1eru12	kamal.jazar@shopify.com	kamal.jazar	https://www.gravatar.com/avatar/036b3bfc8689590ba0e8529f47f0a10f	kamal.jazar
cmebv9c8e000ys60h7nc87mo1	yuichi.hagio@shopify.com	yuichi.hagio	https://www.gravatar.com/avatar/8b8158a645b9742f39f7b75d62b661cd	yuichi.hagio
cmebzstpu001us60h7samk67r	kara.marnell@shopify.com	kara.marnell	https://www.gravatar.com/avatar/6f7b3fa26a9c5df6453a987c70267664	kara.marnell
cmecorvm50003s60hdf0dyhkm	georgia.keegan@shopify.com	georgia.keegan	https://www.gravatar.com/avatar/99012e2a28e357dff15d149c19561791	georgia.keegan
cmed48k5r0000s60hq67cd1uu	brandon.fonseca@shopify.com	brandon.fonseca	https://www.gravatar.com/avatar/1357b5b6babe08d9fccfc245e04f8439	brandon.fonseca
cmehgl1r40000s60h5d1sgprr	regina.wong@shopify.com	regina.wong	https://www.gravatar.com/avatar/75e1e0f01e539a9d2316a2d50432b2c8	regina.wong
cmf2s9hoe0002s60hjnav3bor	mclane.teitel@shopify.com	McLane	https://www.gravatar.com/avatar/d0d8a60f1f545cb83c4c849a08957b4d	mclane.teitel
cmfmrivtz0000s60hn6rjh5nu	richard.wilson@shopify.com	richard.wilson	https://www.gravatar.com/avatar/700282b4049ef24ef3d46f2602268a93	richard.wilson
cmesx6ypb0001s60h7oor91x8	jared.tredly@shopify.com	Jared Tredly	https://www.gravatar.com/avatar/782d592d201e764e47930c65921c06d3	jared.tredly
cmg85whne0000s60h3nuk70o6	kristen.altomareciallella@shopify.com	kristen.altomareciallella	https://www.gravatar.com/avatar/cf68e3683a7b5560cf98fb44608a4f15	kristen.altomareciallella
cmhw3va0j0000s60ht6x7zojp	vince.duquette@shopify.com	vince.duquette	https://www.gravatar.com/avatar/2998c62c8ddce9fa52f18778d27b49b8	vince.duquette
cmebust5a0003s60hnb9ae5oq	madhav.thaker@shopify.com	madhav.thaker	https://www.gravatar.com/avatar/411fedf7e2dce52fdd25d3c9d7cb74b0	madhav.thaker
cmebusv2s0006s60hkpqilmmt	nick.ryan@shopify.com	nick.ryan	https://www.gravatar.com/avatar/bad898398d70127d0ab250c944b00d75	nick.ryan
cmebut1g40009s60hbu1kgdz2	jenny.potter@shopify.com	jenny.potter	https://www.gravatar.com/avatar/085019dffa6de0d43f59ea1a5d7eacba	jenny.potter
cmebut1q2000as60h58o5e2iu	kass.predovic@shopify.com	kass.predovic	https://www.gravatar.com/avatar/cff86143366a30901341bfac8a1dee54	kass.predovic
cmebut35v000bs60h55jc6n53	knight.lin@shopify.com	knight.lin	https://www.gravatar.com/avatar/4c08cdef43a49df80d9f78cb8a11c542	knight.lin
cmebut792000es60hetixuljl	ryan.walters@shopify.com	ryan.walters	https://www.gravatar.com/avatar/d65673b2837ca73185abe4715f2a8392	ryan.walters
cmebvciyp0013s60h9sm9p8qj	denzel.kwan@shopify.com	denzel.kwan	https://www.gravatar.com/avatar/d3b77f0498aacd249aa4029db8a897bc	denzel.kwan
cmebzuk4x001vs60hym0julym	matt.orsborn@shopify.com	matt.orsborn	https://www.gravatar.com/avatar/0e86bdc675ead549450863ea3a09d2ce	matt.orsborn
cmecpbiyd0004s60hvoc3os5b	peyman.naeini@shopify.com	peyman.naeini	https://www.gravatar.com/avatar/d99eb554132777597fe2765be20d2f1a	peyman.naeini
cmed4ffbx0001s60huixii3l3	peter.richmond@shopify.com	peter.richmond	https://www.gravatar.com/avatar/adefd5e3bf589e013020fa7ed0feef57	peter.richmond
cmeho18le0000s60hn8kyn5zb	tim.urian@shopify.com	tim.urian	https://www.gravatar.com/avatar/a36c7b5fb49696e5b208153e97a4e31d	tim.urian
cmet4iaps0000s60hbyycrgmn	scott.duncombe@shopify.com	scott.duncombe	https://www.gravatar.com/avatar/6ab42d267eded0ae7c12a9fce98f955c	scott.duncombe
cmfpi4rhn0000s60hz8bxvwxb	caitlin.goldston@shopify.com	caitlin.goldston	https://www.gravatar.com/avatar/fdd2917048aa60826b344c09af589c40	caitlin.goldston
cmf2sbwyu0006s60h7jd9ud7g	melike.turgut@shopify.com	melike	https://www.gravatar.com/avatar/6931ee3dc0dee41fd5e8769cf9ea48ab	melike.turgut
cmg9kmuwq0000s60hyd4y5bos	kieran.osgood@shopify.com	kieran.osgood	https://www.gravatar.com/avatar/9a20f75eedb6f91f37aafea56f57e0a4	kieran.osgood
cmhw6hhv50006s60h60exi1w1	jon.way@shopify.com	jon.way	https://www.gravatar.com/avatar/a2dcdcd63645168012da5e5a8967c6f6	jon.way
cmebustg30006s60hvuxbjkjq	adam.kortlever@shopify.com	adam.kortlever	https://www.gravatar.com/avatar/76c6e1d1e9d6522aeac3c87795232962	adam.kortlever
cmebuswcl000bs60h3layq5cz	danny.garcia@shopify.com	danny.garcia	https://www.gravatar.com/avatar/d6ce06c0b8bcf0de7b31d620444b3752	danny.garcia
cmebvdm160014s60ht71cj5h7	josh.brinson@shopify.com	josh.brinson	https://www.gravatar.com/avatar/270f1a39c937f7835b9174efedeaabf4	josh.brinson
cmec0cu42001ws60h0h1jgbkp	benjamin.michel@shopify.com	benjamin.michel	https://www.gravatar.com/avatar/5c98cf39b8ee11362ce79f71f2db6468	benjamin.michel
cmec0e0ro001xs60hrebojvpv	chris.cichon@shopify.com	chris.cichon	https://www.gravatar.com/avatar/be99bfbea2e1325dbf9542d8cdb25fe1	chris.cichon
cmecpx4bg0000s60hek7t4zcg	camilo.garcialarotta@shopify.com	camilo.garcialarotta	https://www.gravatar.com/avatar/187928512c0ead5314762d72862054c4	camilo.garcialarotta
cmed6pu3l0002s60hx1exitjh	zach.reynochiasson@shopify.com	zach.reynochiasson	https://www.gravatar.com/avatar/d03c2d5e56e089957de86ed5a427e11f	zach.reynochiasson
cmed6sk0m0003s60htzsnao6g	shameel.abdullah@shopify.com	shameel.abdullah	https://www.gravatar.com/avatar/c66e3c47dd07adc6ecf70a8453c1299e	shameel.abdullah
cmehr0qwr0000s60h70mjw49m	sheri.nguyen@shopify.com	sheri.nguyen	https://www.gravatar.com/avatar/6931a8b523f218ec2c7b5e3b36c77a10	sheri.nguyen
cmetzes6o0000s60hll625r57	morgan.lockhart@shopify.com	morgan.lockhart	https://www.gravatar.com/avatar/f9d0d681ed3513cff7df1f711746f967	morgan.lockhart
cmf4ac4k90000s60h4kkct3rf	meishang.chen@shopify.com	meishang.chen	https://www.gravatar.com/avatar/7769f2e03b56cae2bda3fad124683d21	meishang.chen
cmfxop3s00000s60h42rhp3hd	mark.roche@shopify.com	mark.roche	https://www.gravatar.com/avatar/bd46386a34cdeb992bc2f658311ef2d9	mark.roche
cmgb82ca20003s60hadzdkoe3	mark.mccray@shopify.com	mark.mccray	https://www.gravatar.com/avatar/54e6d6802e54917cbf1e5a8568f1fcf4	mark.mccray
cmhw71wpx0007s60hiwwj1irq	derek.briggs@shopify.com	derek.briggs	https://www.gravatar.com/avatar/8e9c5fd010069f79e56c0fe7db6a02b1	derek.briggs
cmebustvc0004s60hlz44r5jg	sara.adcock@shopify.com	sara.adcock	https://www.gravatar.com/avatar/8736a8d6a49d2538d6118de7b2f018a2	sara.adcock
cmebustwg0005s60h19b77n85	lily.chaw@shopify.com	lily.chaw	https://www.gravatar.com/avatar/e8225473df367e4449036f1fbf353389	lily.chaw
cmebut0aj0009s60hcyzusar8	travis.amaral@shopify.com	travis.amaral	https://www.gravatar.com/avatar/2b30346afd112eac398d4027e6ad16d0	travis.amaral
cmebut48w000ds60hqea2tmhj	sam.goldsmith@shopify.com	sam.goldsmith	https://www.gravatar.com/avatar/26d950474896e9e3a27cac49e82f5ef3	sam.goldsmith
cmebut5oq000es60hfmbymcey	meg.swim@shopify.com	meg.swim	https://www.gravatar.com/avatar/b572bdbe0a5522653bb3d510c7c84f0e	meg.swim
cmebut6xa000fs60hx71ebx5t	jon.lane@shopify.com	jon.lane	https://www.gravatar.com/avatar/9b3d5651eb01ee2f2252ed407d0ab854	jon.lane
cmebvf1o30015s60h6jpk6cbz	stephanie.shum@shopify.com	stephanie.shum	https://www.gravatar.com/avatar/13fe009e14745cc4d40c176d2a91655e	stephanie.shum
cmec1r24g001ys60hl6hrd77a	stewart.parry@shopify.com	stewart.parry	https://www.gravatar.com/avatar/883d0d413cb225a2071157abc7da43c4	stewart.parry
cmecqtix00001s60h9ubb6d9z	mike.moran@shopify.com	mike.moran	https://www.gravatar.com/avatar/b74b836ae78a67dfcec91afa4f3f6787	mike.moran
cmed6ua2h0004s60ho9u7wixp	jake.hendrick@shopify.com	jake.hendrick	https://www.gravatar.com/avatar/77ce1569712262c4c25e8a7376ffb74a	jake.hendrick
cmeihxqmp0000s60hvjq198b5	eamon.brett@shopify.com	eamon.brett	https://www.gravatar.com/avatar/b58a9877f8414335143168f64ad8dbe7	eamon.brett
cmevetfjg0000s60h183h8j5i	floris.dekker@shopify.com	floris.dekker	https://www.gravatar.com/avatar/a3d2c3ea3b6e5725b4d6b5a352aebe42	floris.dekker
cmabnm4fs0000s60hiyjquj3k	daniel.calderwood@shopify.com	daniel.calderwood	https://www.gravatar.com/avatar/71b2a5173e89c41c6389324da927df51	daniel.calderwood
cmfxxsmri0000s60hdq02bj4c	brennan.letkeman@shopify.com	brennan.letkeman	https://www.gravatar.com/avatar/a3d602c60a8e447a9f1cf330cccf89d4	brennan.letkeman
cmgb9r6ll0006s60hopqcnzz6	trisha.causley@shopify.com	trisha.causley	https://www.gravatar.com/avatar/1c8902b4783ad8fd181c376c0b69c5a1	trisha.causley
cmhwea8vt0000s60hz1aoumol	nicola.fahy@shopify.com	nicola.fahy	https://www.gravatar.com/avatar/fd9ad8282a8d5e9e86b8933277796998	nicola.fahy
cmebusueu001gs60hl45180vi	ivan.chepelev@shopify.com	ivan.chepelev	https://www.gravatar.com/avatar/eb024de5654893733bbfb439aba0b061	ivan.chepelev
cmebusuf5001hs60hqohkq2ty	priya.patel@shopify.com	priya.patel	https://www.gravatar.com/avatar/fc2461cf93d29f6f2f8b29a76717e335	priya.patel
cmebusug30004s60hfp5etvwx	carrie.gofron@shopify.com	carrie.gofron	https://www.gravatar.com/avatar/7ec27cc9e4d2d3b92dd1d3ddc094f6da	carrie.gofron
cmebusuxt001js60hvemgibgj	swastik.naik@shopify.com	swastik.naik	https://www.gravatar.com/avatar/dbf78216d769acc68c091d8955ed3915	swastik.naik
cmebusuyw001ks60hocxeuru0	jordan.rostowsky@shopify.com	jordan.rostowsky	https://www.gravatar.com/avatar/205fad44bb8fcd006b4415290af49a6e	jordan.rostowsky
cmebusvf9001ns60hfbqadrlj	patrick.millegan@shopify.com	patrick.millegan	https://www.gravatar.com/avatar/bcc7e63487acf6e6aeb4ed7f6ef8b271	patrick.millegan
cmebusygx001vs60hdeinbpd5	nicolas.berg@shopify.com	nicolas.berg	https://www.gravatar.com/avatar/4a857133ed224dc99359a2e30fa49d4b	nicolas.berg
cmebusyl7001ws60h1mt8clij	rafael.seemann@shopify.com	rafael.seemann	https://www.gravatar.com/avatar/9a353c6c99d9adc1ec66deadbbb5ab8b	rafael.seemann
cmebut0400020s60hcbx9yx1f	amitoj.brar@shopify.com	amitoj.brar	https://www.gravatar.com/avatar/8af0ea15ba79440aad58d0f80b4a2c57	amitoj.brar
cmebut0v00023s60ho9jzcb7s	michael.salvati@shopify.com	michael.salvati	https://www.gravatar.com/avatar/9071eb98810badf28273f68326fc843e	michael.salvati
cmebut25m0027s60hb4ex3h60	jonathan.zazove@shopify.com	jonathan.zazove	https://www.gravatar.com/avatar/24aef3ed331b38b228d2849790cb7159	jonathan.zazove
cmebut85q000fs60horoc2djl	sam.ou@shopify.com	sam.ou	https://www.gravatar.com/avatar/476471e95b1315e24248bacbc0326b0e	sam.ou
cmebut9w4002hs60h4kkb7nwe	connor.mccambridge@shopify.com	connor.mccambridge	https://www.gravatar.com/avatar/be1b8f938c18ac5f9ac341404800e4f6	connor.mccambridge
cmebutaq5002is60htxjbwghf	jonny.lomond@shopify.com	jonny.lomond	https://www.gravatar.com/avatar/8ae30c89a30b97689484d8ba86ea094a	jonny.lomond
cmebutblq002ks60hjpxy3se8	ann.alexander@shopify.com	ann.alexander	https://www.gravatar.com/avatar/eb16eba01a1941acb585e23c12f42a8f	ann.alexander
cmebutblv002ls60hvm0xkb69	rafa.lastirimonroy@shopify.com	rafa.lastirimonroy	https://www.gravatar.com/avatar/aa720aace3c1237d5d92b336a24bb377	rafa.lastirimonroy
cmebvihbn0016s60hnwmjcfqh	arun.kuchibhatla@shopify.com	arun.kuchibhatla	https://www.gravatar.com/avatar/586d6c5003fde6f1143a4eea9d04961f	arun.kuchibhatla
cmec3qx3g0000s60hm1ddmpa4	marcjohn.odendaal@shopify.com	marcjohn.odendaal	https://www.gravatar.com/avatar/9d3318ecb6f9049a81ce8ae2c30cb714	marcjohn.odendaal
cmecs1s4n0000s60h06iv0lrh	nick.lepine@shopify.com	nick.lepine	https://www.gravatar.com/avatar/7726c2ef89b98e0896519eb2f739bf0b	nick.lepine
cmed6vrfn0005s60hj8k0h0he	daniela.velasquez@shopify.com	daniela.velasquez	https://www.gravatar.com/avatar/3d0a047c115f852a5c3a9abdac402bfd	daniela.velasquez
cmeir3lh60000s60hxzqnf48a	ian.robertson@shopify.com	ian.robertson	https://www.gravatar.com/avatar/bc20aa50d54a62ddce5d9149d89da738	ian.robertson
cmevo65q30000s60h9ottkrcc	nicolas.burford@shopify.com	nicolas.burford	https://www.gravatar.com/avatar/4cfd994ed42cd687aa99370dc6c0328e	nicolas.burford
cmf4ed24s0000s60hkvvdolr3	sarah.nick@shopify.com	sarah.nick	https://www.gravatar.com/avatar/584f770228e467e1b523e63ef214d0c0	sarah.nick
cmfzmicjn0000s60hdv23xkap	diana.ibranovic@shopify.com	diana.ibranovic	https://www.gravatar.com/avatar/cd47ee3fc74926404cff8daa19b4bdf3	diana.ibranovic
cmgbbc2yc0000s60h4jszwx97	annie.qin@shopify.com	annie.qin	https://www.gravatar.com/avatar/c8c083ef705d873e820837f46298ca59	annie.qin
cmhxn4fwl0000s60hqjxayszn	omas.abdullah@shopify.com	omas.abdullah	https://www.gravatar.com/avatar/465f9b5697f3bc599da13c7dd5b47966	omas.abdullah
cmebusun1001is60hvhwgzi7s	anthony.tasca@shopify.com	anthony.tasca	https://www.gravatar.com/avatar/5587836eebdf4bb5569abd23ffae3ff7	anthony.tasca
cmebusupl0000s60h0kgc8w0r	adi.matheswaran@shopify.com	adi.matheswaran	https://www.gravatar.com/avatar/4de2ec67b087d8df6487ba2e6c76311f	adi.matheswaran
cmebusuqo0007s60hoi4xvk0r	josh.lutz@shopify.com	josh.lutz	https://www.gravatar.com/avatar/c385ba92434a9e3bcbd59f1bf8e5ae56	josh.lutz
cmebusv1h0008s60h3cstginh	joshua.sager@shopify.com	joshua.sager	https://www.gravatar.com/avatar/574b22b04bd9ac0b7d358ea9b3c4d470	joshua.sager
cmebusvec0009s60h7b0th721	tim.borkhodoev@shopify.com	tim.borkhodoev	https://www.gravatar.com/avatar/c8cdd7f9ef17bd61784e509f2cca8f8f	tim.borkhodoev
cmebusy1f001us60hxcdf4vkt	mitch.hamlyn@shopify.com	mitch.hamlyn	https://www.gravatar.com/avatar/2be8504fac194e41f561c98637e1441a	mitch.hamlyn
cmebut0500021s60hrnslt1cs	john.dewyze@shopify.com	john.dewyze	https://www.gravatar.com/avatar/322eedd6ad657ee28e908f22a301dc39	john.dewyze
cmebut0pp0022s60hwqy963aa	delong.gao@shopify.com	delong.gao	https://www.gravatar.com/avatar/d3e5639d16010eaf425a53336d3b88c4	delong.gao
cmebut3rm0028s60h5xi736fo	james.kieley@shopify.com	james.kieley	https://www.gravatar.com/avatar/f70e902e574313c70eaef06259119a9e	james.kieley
cmebut8e6000gs60h7ak42ps0	johann.hibschman@shopify.com	johann.hibschman	https://www.gravatar.com/avatar/bc5b3081f76b01dceec41d6610fa6a8d	johann.hibschman
cmebut9mu002gs60h93cdg17w	jesse.sharps@shopify.com	jesse.sharps	https://www.gravatar.com/avatar/06f7f3ad07010537fa56010cdd5508d6	jesse.sharps
cmebusx2g001rs60hrn99o6dt	han.tan@shopify.com	@Han	https://www.gravatar.com/avatar/37a548c275277e289b4d7209e20a1fd9	han.tan
cmebvnseh0017s60h72nb5t1q	derek.wu@shopify.com	derek.wu	https://www.gravatar.com/avatar/0bb757ce0846decda039d564828c8fe0	derek.wu
cmec5rq2g0000s60hnas840pj	bruno.aybar@shopify.com	bruno.aybar	https://www.gravatar.com/avatar/c9e60fbd73ae0a418d064c1310419725	bruno.aybar
cmecs4efb0001s60h6gm500l8	amy.ly@shopify.com	amy.ly	https://www.gravatar.com/avatar/680cdd78cc1d57454cb87264101bbe92	amy.ly
cmed6whl80006s60hciyo26vv	lindsay.mantzel@shopify.com	lindsay.mantzel	https://www.gravatar.com/avatar/92f3cd33c74e1d744fbf504c888fb375	lindsay.mantzel
cmeit5kjc0000s60h74msj9le	travis.brannen@shopify.com	travis.brannen	https://www.gravatar.com/avatar/8ce396f8ca54123c9fdaaf02ce97557c	travis.brannen
cm8eqi9y80003s60h4d7kqdsh	anastasiya.berehulyak@shopify.com	anastasiya.berehulyak	https://www.gravatar.com/avatar/6601b91090e384cb897f04170e56eebc	anastasiya.berehulyak
cmf5dwrd20000s60hb9a2kwl2	charles.ouimet@shopify.com	charles.ouimet	https://www.gravatar.com/avatar/2993c5377e37786c6e9d0b691c4e5dc0	charles.ouimet
cmg0oye0e0000s60heg45niyj	dj.patterson@shopify.com	dj.patterson	https://www.gravatar.com/avatar/149f2ee17b23282306eceea9d5fea597	dj.patterson
cmgf7rlg50000s60heqwuwwov	amber.jones@shopify.com	amber.jones	https://www.gravatar.com/avatar/21fd7807e6d9bfb06f2bdf800c2ef0de	amber.jones
cmhzfui4b0000s60hyxk47yaf	chad.miller@shopify.com	chad.miller	https://www.gravatar.com/avatar/dad92b9efc3c685e1421460b9b4cc11c	chad.miller
cmebusv8b0008s60o4nplfpk8	aaron.richner@shopify.com	aaron.richner	https://www.gravatar.com/avatar/c13617b338cbc9555d3bc5ecfe674e32	aaron.richner
cmebusvbp0009s60ohuoh3i8p	chad.carlson@shopify.com	chad.carlson	https://www.gravatar.com/avatar/17ec81583615eceabec163b7d9b265a5	chad.carlson
cmebusvko000as60hqjbmy7hw	jesse.breneman@shopify.com	jesse.breneman	https://www.gravatar.com/avatar/c6bb5c5110e96e761830d39775266a42	jesse.breneman
cmebusvzz0000s60hessn9sig	luke.krikorian@shopify.com	luke.krikorian	https://www.gravatar.com/avatar/b2c2daa2309127bd086c7577fdb54059	luke.krikorian
cmebusws10001s60hb41hctlg	alison.evansadnani@shopify.com	alison.evansadnani	https://www.gravatar.com/avatar/70436bcdcbda66594888a2913ba13ecc	alison.evansadnani
cmebusz0u000bs60oer4abk4f	narges.ashrafizadeh@shopify.com	narges.ashrafizadeh	https://www.gravatar.com/avatar/b45c89cd1ecb888077113cab76d5d114	narges.ashrafizadeh
cmebusz27000cs60oz5bszd73	scott.walkinshaw@shopify.com	scott.walkinshaw	https://www.gravatar.com/avatar/5f66689727c63b79abd9450b121fb2a6	scott.walkinshaw
cmebusz9u0007s60hesdvf56h	daniel.rossos@shopify.com	daniel.rossos	https://www.gravatar.com/avatar/e74535acd044904f329a58f6ceee78e1	daniel.rossos
cmebut13j0008s60hvqolaolk	colin.rowbotham@shopify.com	colin.rowbotham	https://www.gravatar.com/avatar/e308aedb17238cc9cb3fb00572c5ac42	colin.rowbotham
cmebut2s4000es60o5xug4rhp	victor.tortolero@shopify.com	victor.tortolero	https://www.gravatar.com/avatar/de81eeaab269285762797f491dcba85c	victor.tortolero
cmebut4au000es60h9pzno1aq	sachin.patel@shopify.com	sachin.patel	https://www.gravatar.com/avatar/b352a4a06829f764baa3054bbad42b64	sachin.patel
cmebut5jc000fs60hwyhzmf2w	noel.johnson@shopify.com	noel.johnson	https://www.gravatar.com/avatar/500873db60e131126be37ad639bbbf24	noel.johnson
cmebut9gh000hs60oezzbf0ay	samuel.oyediran@shopify.com	samuel.oyediran	https://www.gravatar.com/avatar/26128cbc112a41904aa418ccfd1eca27	samuel.oyediran
cmebutbby000hs60heyyn77rd	michael.wilkerson@shopify.com	michael.wilkerson	https://www.gravatar.com/avatar/8d120c8bca4b8cb9edcfc9a19c3c9bb8	michael.wilkerson
cmebutcgf000is60hwnok3sl5	scott.campbell@shopify.com	scott.campbell	https://www.gravatar.com/avatar/ed362b02575ddcc2cfd8326c135b54c8	scott.campbell
cmebutcj7000is60oc6r5alq9	camiel.vanschoonhoven@shopify.com	camiel.vanschoonhoven	https://www.gravatar.com/avatar/dcd27c12b08f877d73620715e098de47	camiel.vanschoonhoven
cmebvoj3k0018s60hn604ywu9	christophe.nauddulude@shopify.com	christophe.nauddulude	https://www.gravatar.com/avatar/f96e4afab5dc8c1b5ede9dd580a73533	christophe.nauddulude
cmec5v3ss0001s60hc1tjgmhd	mladen.rangelov@shopify.com	mladen.rangelov	https://www.gravatar.com/avatar/a59ffcd04e22269269a3e20e164abf53	mladen.rangelov
cmecs51gj0002s60hfdt12v84	max.arvidsson@shopify.com	max.arvidsson	https://www.gravatar.com/avatar/546901c4a846dbdb851fef06cc4b80a3	max.arvidsson
cmed76aua0007s60hkfhpgspw	emma.eagles@shopify.com	emma.eagles	https://www.gravatar.com/avatar/489884af0a1576fe696255cbb789c010	emma.eagles
cmeiu4qyf0000s60hd1zhznau	kyle.giesbrecht@shopify.com	kyle.giesbrecht	https://www.gravatar.com/avatar/6ef9b92aea59b73ed7401e7736d6ee96	kyle.giesbrecht
cmewzxxyh0000s60h8qj9qm7k	aidan.macaluso@shopify.com	aidan.macaluso	https://www.gravatar.com/avatar/6000fce1cadecbe7a528ab54a202e78f	aidan.macaluso
cmf5os62i0000s60hzdoob42c	vesna.brown@shopify.com	vesna.brown	https://www.gravatar.com/avatar/a8102ff89a6417cd43ea69198b7ae110	vesna.brown
cmg0ucb5b0000s60hpo2ppka0	andrea.aho@shopify.com	andrea.aho	https://www.gravatar.com/avatar/3daf4689d29275d86cbd5d0f3c14e6be	andrea.aho
cmgfejc9o0005s60hlc5hdh40	zack.harley@shopify.com	zack.harley	https://www.gravatar.com/avatar/34d45e600797770e18ae721f465c3775	zack.harley
cmi62avqg0000s60hu2bsl2g6	andreas.pihlstrom@shopify.com	andreas	https://www.gravatar.com/avatar/9ba13cf775569f624066bdebf18a5b68	andreas.pihlstrom
cmebuszjk001ys60hunc92unp	sanjar.sobirjonov@shopify.com	sanjar.sobirjonov	https://www.gravatar.com/avatar/71bbd3753a96fb121013925a99ae780e	sanjar.sobirjonov
cmebut1mk0025s60hk3l87iue	sahand.sadi@shopify.com	sahand.sadi	https://www.gravatar.com/avatar/c8e89625465b14b606c5b08e4a42b34d	sahand.sadi
cmebutd32002ns60hd2htpzxc	hisham.kalban@shopify.com	hisham.kalban	https://www.gravatar.com/avatar/fefdefe1657dbaca65ce5075908020e2	hisham.kalban
cmebvv9xd0019s60hmp868r5c	thomas.orgler@shopify.com	thomas.orgler	https://www.gravatar.com/avatar/6961feb7619797e2697d96646555f808	thomas.orgler
cmec9jx6u0000s60hhj24xnkp	mohamad.elharoufi@shopify.com	mohamad.elharoufi	https://www.gravatar.com/avatar/9dca451ea8d629cc5d9b3336d09a6a20	mohamad.elharoufi
cmecsl6ys0003s60ht3my2f80	gary.abbott@shopify.com	gary.abbott	https://www.gravatar.com/avatar/b4e3b748a6ed0ec93fc73179b1d78ed0	gary.abbott
cmedbbe8j0000s60hoyc2060v	scott.brooks@shopify.com	scott.brooks	https://www.gravatar.com/avatar/dcaf89b5292057ee4f001ddc7e5d9a33	scott.brooks
cmej9r03b0000s60hgtzehgw0	liam.fennell@shopify.com	liam.fennell	https://www.gravatar.com/avatar/1257846162f4fefad4442be7722f6c32	liam.fennell
cmf6wl6320000s60hlvtqnkf9	hugo.vacher@shopify.com	hugo.vacher	https://www.gravatar.com/avatar/5e9b9a39ef34d693b0177aac7a058336	hugo.vacher
cmg0xqw880000s60hxijttze6	jeanfrederic.fortier@shopify.com	jeanfrederic.fortier	https://www.gravatar.com/avatar/58739b58ebe9ae48b921c51df3e7aaff	jeanfrederic.fortier
cmgffwio50006s60heotenm0m	sebastien.gregoire@shopify.com	sebastien.gregoire	https://www.gravatar.com/avatar/67560904729051e3f9763664788ed093	sebastien.gregoire
cmi66rlll0007s60hl5jcgtpr	kimberly.tee@shopify.com	kimberly.tee	https://www.gravatar.com/avatar/0605ea013c193ee6d90f50e340769333	kimberly.tee
cmebut44o000cs60has7wvgma	christian.moore@shopify.com	christian.moore	https://www.gravatar.com/avatar/c722037f170a5dc5a439dd366873f1ae	christian.moore
cmebut8cy000hs60hcif4yvi2	jasmin.decampos@shopify.com	jasmin.decampos	https://www.gravatar.com/avatar/07304eade0b26b677cafd4b77a40edd4	jasmin.decampos
cmebutaim000js60hnswas60e	adam.wishart@shopify.com	adam.wishart	https://www.gravatar.com/avatar/fe3c3d2474b1fcf119c66a357d80eb61	adam.wishart
cmebvyix5001as60hlracmdso	cameron.bothner@shopify.com	cameron.bothner	https://www.gravatar.com/avatar/0c7caf0c353795bc2c30744c367e78ca	cameron.bothner
cmecak5030001s60hou4j5f3d	erik.newcomb@shopify.com	erik.newcomb	https://www.gravatar.com/avatar/aee2459c0871edc3ee9a05910d62a74d	erik.newcomb
cmecu3agm0004s60hh3fm4l6m	lisa.tang@shopify.com	lisa.tang	https://www.gravatar.com/avatar/751c08f537e3cfd02a03bdc2762e7c98	lisa.tang
cmedcfma30000s60hvwob1r1f	brooks.lybrand@shopify.com	brooks.lybrand	https://www.gravatar.com/avatar/ec8de71a9d27d5bc8fb6ab9da4a0c135	brooks.lybrand
cmejmv0ip0000s60hcje4vc4n	samuel.giles@shopify.com	samuel.giles	https://www.gravatar.com/avatar/5ab6c4da99c403563db8688c8a5a13d6	samuel.giles
cmf8y9seg0000s60hqetsoagt	sienna.wishart@shopify.com	sienna.wishart	https://www.gravatar.com/avatar/d8bbe40f79fcf6421717ec6a501245a1	sienna.wishart
cmg0ywtc00000s60hyigtpy50	seth.mcclimans@shopify.com	seth.mcclimans	https://www.gravatar.com/avatar/3cecc15d2a5b0f41229082575a99bcdf	seth.mcclimans
cmgfwwcys0000s60hxazabvnk	al.mcquiston@shopify.com	al.mcquiston	https://www.gravatar.com/avatar/0f5be617dfe2688440dd7a71810a81c0	al.mcquiston
cmi7tq49u0009s60hqblhh121	isabella.melita@shopify.com	isabella.melita	https://www.gravatar.com/avatar/02404f6eaf390036829dedda2824e2ea	isabella.melita
cmebut5hc000cs60hf89lo9yk	carmen.propp@shopify.com	carmen.propp	https://www.gravatar.com/avatar/99967311ae6b7ec1326c04e538d753b8	carmen.propp
cmebut6xv000gs60o0lbd9c61	patrick.joyce@shopify.com	patrick.joyce	https://www.gravatar.com/avatar/7c95ecc68c773ea68221a3f482c19d68	patrick.joyce
cmebutayj000gs60h33raxywc	nancy.tan@shopify.com	nancy.tan	https://www.gravatar.com/avatar/398da4ac6e1587c06fa017470a969831	nancy.tan
cmebutf2p000js60oi0nfg13j	rishi.venkat@shopify.com	rishi.venkat	https://www.gravatar.com/avatar/a4943e2c08f2a7feb81442b32fe2d796	rishi.venkat
cmebutfkq002os60hmt51hrw3	aaron.glazer@shopify.com	aaron.glazer	https://www.gravatar.com/avatar/63ffab39a61c897f27e1ef04fb7c1f2e	aaron.glazer
cmebutfkx002ps60hrodwd3nv	ryan.glover@shopify.com	ryan.glover	https://www.gravatar.com/avatar/57daf9e74cf0e4fe85b31ac6bcec9e7f	ryan.glover
cmebutfl5002qs60hwnyqv32i	edouard.hieaux@shopify.com	edouard.hieaux	https://www.gravatar.com/avatar/ca60ada6e83b9ec40998735d4f520440	edouard.hieaux
cmebutfpo000hs60htvkj0vna	rich.chen@shopify.com	rich.chen	https://www.gravatar.com/avatar/7bf602200c710b989f0e74f80ea1f051	rich.chen
cmebutgxi000ks60hrtfmexus	eric.woelker@shopify.com	eric.woelker	https://www.gravatar.com/avatar/ffdaf38ced97295f2b7df37056a481d4	eric.woelker
cmebuthiw000is60h9502apxu	amy.tacon@shopify.com	amy.tacon	https://www.gravatar.com/avatar/fd83373b5dbba535e92a43c5890aa4ab	amy.tacon
cmebuthj1000js60h55iftwe2	gursimar.singh@shopify.com	gursimar.singh	https://www.gravatar.com/avatar/d69733759fb2e03ad7f7ecd2ac5489e9	gursimar.singh
cmebuti2k000ks60hc69ppjan	mirerfan.gheibi@shopify.com	mirerfan.gheibi	https://www.gravatar.com/avatar/a2220070a7f3c4383ce012f7285811d2	mirerfan.gheibi
cmebutinv002rs60hc3qhv3gc	andrew.ross@shopify.com	andrew.ross	https://www.gravatar.com/avatar/d3a109ddb33df496cd2db0acf24d8e02	andrew.ross
cmebutj2h002ss60h2icvxgn9	kate.sterling@shopify.com	kate.sterling	https://www.gravatar.com/avatar/08653778e67c4801f65e5922d86344e8	kate.sterling
cmebutjao002ts60hozvv7ftd	justin.fuenzalida@shopify.com	justin.fuenzalida	https://www.gravatar.com/avatar/3c1f7af5e131589f6df69650846a423a	justin.fuenzalida
cmebutjb2002us60h3yl3ad3r	claude.mendelson@shopify.com	claude.mendelson	https://www.gravatar.com/avatar/10d3711922b1b11858f4325f3821c0ca	claude.mendelson
cmebutjhi002vs60hichg1blf	douglas.cuzner@shopify.com	douglas.cuzner	https://www.gravatar.com/avatar/0a3f776fb40f056bfd31f11e83d45018	douglas.cuzner
cmebutksh000ls60hmslerxai	sam.elbenhawy@shopify.com	sam.elbenhawy	https://www.gravatar.com/avatar/210e1272d844e4904a5932bb27a6c898	sam.elbenhawy
cmebutlt4000ks60o9p8cfzsr	charles.ng@shopify.com	charles.ng	https://www.gravatar.com/avatar/cf1c4430b5dea503c58e1d080787b499	charles.ng
cmebutn0y002ws60hpcnzp0ev	eric.lybrand@shopify.com	eric.lybrand	https://www.gravatar.com/avatar/c9fcf26c3aa9fefd9d914c78683404a9	eric.lybrand
cmebutnp7002xs60hsig47pec	andrew.ling@shopify.com	andrew.ling	https://www.gravatar.com/avatar/7f3ed91c09e8af3fead8cbc84dfe5bde	andrew.ling
cmebutove002ys60hqaepvscu	taylor.graham@shopify.com	taylor.graham	https://www.gravatar.com/avatar/55003d82636ed40a7a10cf267f1e470f	taylor.graham
cmebutp6j002zs60hk0fxa4cf	craig.brunner@shopify.com	craig.brunner	https://www.gravatar.com/avatar/d4635434a244735645f1546603c08905	craig.brunner
cmebutpcq0030s60hgohvp7jf	wesley.marr@shopify.com	wesley.marr	https://www.gravatar.com/avatar/bc98e459afb840861ad356dcf2da5aa1	wesley.marr
cmebutqtp0031s60h4k1b66g1	ari.halle@shopify.com	ari.halle	https://www.gravatar.com/avatar/c3e3c3f6e37202fa3263ca07ec26c328	ari.halle
cmebutrkx0032s60hqg1wuynl	jerie.shaw@shopify.com	jerie.shaw	https://www.gravatar.com/avatar/d9ad80a048c079fad9834b6631b604b0	jerie.shaw
cmebutrtv000ms60hc5vv035w	jonathan.hsiao@shopify.com	jonathan.hsiao	https://www.gravatar.com/avatar/9367aa7897de33f4fb54ca980f0d4d71	jonathan.hsiao
cmebutsdw0033s60hmu53br83	ivan.velasquez@shopify.com	ivan.velasquez	https://www.gravatar.com/avatar/7bdb8b0221be7ea82030d6ba6a06c227	ivan.velasquez
cmebutsfu0034s60h71p4l2gj	bernardo.garcia@shopify.com	bernardo.garcia	https://www.gravatar.com/avatar/f9cd99e72e28a9b86088a10467428242	bernardo.garcia
cmebuttfm0035s60h7bdxvxv4	joey.cardosi@shopify.com	joey.cardosi	https://www.gravatar.com/avatar/e3408a2a647d8e3ce4e2018590530418	joey.cardosi
cmebuttwl0036s60he0e7g3jg	joe.letizia@shopify.com	joe.letizia	https://www.gravatar.com/avatar/8b57eed046d7248b7e8ceb033bea3480	joe.letizia
cmebutu1i0037s60h0h2zl67f	renee.ren@shopify.com	renee.ren	https://www.gravatar.com/avatar/0e05062e6137aa2e8ca21b4109f0b89d	renee.ren
cmebutv9f000ls60oim0zgzfe	rebecca.chen@shopify.com	rebecca.chen	https://www.gravatar.com/avatar/de2755e556f756be3ada1fb5e89c441f	rebecca.chen
cmebutwar0038s60hg8cuzs6k	chris.bielinski@shopify.com	chris.bielinski	https://www.gravatar.com/avatar/a006b9a65121c1c84b96bd0405f81051	chris.bielinski
cmebutxa90039s60hu2k85om2	sumer.chawla@shopify.com	sumer.chawla	https://www.gravatar.com/avatar/a6defd35815cf658d3c1d2d3571b4ef7	sumer.chawla
cmebutxrt003as60h434zkjhl	manuel.correa@shopify.com	manuel.correa	https://www.gravatar.com/avatar/a36d233565b5f87df29ab4b217671041	manuel.correa
cmebutz8t003bs60h1bxl2mh5	maxine.patenaude@shopify.com	maxine.patenaude	https://www.gravatar.com/avatar/d092ca4575e28cd9167e0d1041a64037	maxine.patenaude
cmebutzv7003cs60h1g79lu0o	elias.khan@shopify.com	elias.khan	https://www.gravatar.com/avatar/cce74ef17fb20688d1ed0da33ac430ea	elias.khan
cmebutzvz003ds60hoy8lckpz	eric.desjardins@shopify.com	eric.desjardins	https://www.gravatar.com/avatar/80d7c75fbcf8fffdc6faf8bca2048bed	eric.desjardins
cmebuu08d003es60huamsk1ni	mikko.haapoja@shopify.com	mikko.haapoja	https://www.gravatar.com/avatar/36aed15104124ce4c93d857c0cf51a0c	mikko.haapoja
cmebuu0t8003fs60h9u923s0k	alexandru.totolici@shopify.com	alexandru.totolici	https://www.gravatar.com/avatar/831022b6f8c0e84b8e60f1db53e770c3	alexandru.totolici
cmebuu3x5003gs60hyepje7by	kendra.fillingham@shopify.com	kendra.fillingham	https://www.gravatar.com/avatar/16c225bacb20a429708fd330d7b3b519	kendra.fillingham
cmebuu5ux000ls60hqun08ygb	janice.yao@shopify.com	janice.yao	https://www.gravatar.com/avatar/bf68181cf0a2c9b34d7567ef933fa699	janice.yao
cmebuu705003hs60hni2ckd64	michael.dickard@shopify.com	michael.dickard	https://www.gravatar.com/avatar/3a6630bf19010cc5a9580712c1289918	michael.dickard
cmebuu7zg003is60h1rnkop1x	mithun.baskaran@shopify.com	mithun.baskaran	https://www.gravatar.com/avatar/9879c1b506601e14dcc8eefbb44d1679	mithun.baskaran
cmebuu886003js60htncdptv9	nicolas.ottonello@shopify.com	nicolas.ottonello	https://www.gravatar.com/avatar/dee9b4f46823040d2b45c7ab059951fb	nicolas.ottonello
cmebuubew003ks60hwf4jya0k	joe.pym@shopify.com	joe.pym	https://www.gravatar.com/avatar/f37144a6b76c4c75cd4e52b6c19e10af	joe.pym
cmebuuu6k003ts60hi2jlzjeb	gabriela.hixson@shopify.com	gabriela.hixson	https://www.gravatar.com/avatar/1fe8de2beabac7271d5bae3582274c63	gabriela.hixson
cmebuv1fv003ws60hydv856u6	spencer.plant@shopify.com	spencer.plant	https://www.gravatar.com/avatar/053c2ae4a09e7da89e9f462b59d1a9e6	spencer.plant
cmebuvpfw003ys60hii7dqmw1	lily.chebotarova@shopify.com	lily.chebotarova	https://www.gravatar.com/avatar/3277ccb8311efb2c45f2c4404c127ac9	lily.chebotarova
cmebw1nw9001bs60hsj2t9764	brianna.leung@shopify.com	brianna.leung	https://www.gravatar.com/avatar/dbed28c6668d950aafa889aba39e2d06	brianna.leung
cmecio5tv0000s60h2ew8qsnx	alex.kleineborger@shopify.com	alex.kleineborger	https://www.gravatar.com/avatar/2cce357be9a63fc9ee41d7089bd6d30f	alex.kleineborger
cmecvlyn80005s60hb17r151g	andrea.rice@shopify.com	andrea.rice	https://www.gravatar.com/avatar/fb349251479e459e20b6782a0c5f86d6	andrea.rice
cmeg866uf0000s60hawq5oe1s	dalon.dantzler@shopify.com	dalon.dantzler	https://www.gravatar.com/avatar/504b51d76c4b2b7e290994c53768b514	dalon.dantzler
cmek1ueyl0000s60hw8a4gw1m	andreas.zecher@shopify.com	andreas.zecher	https://www.gravatar.com/avatar/4c66248f83b0b0d378a9bb66b638e262	andreas.zecher
cmfbbj4xh0000s60h9djwrgj3	zachary.miller@shopify.com	zachary.miller	https://www.gravatar.com/avatar/a32e01fed3012459fc4c2431dc3a7e54	zachary.miller
cmg0z7m610001s60hfkvojekj	steve.hayes@shopify.com	steve.hayes	https://www.gravatar.com/avatar/e2b4ad71862659c1bd692956ab989790	steve.hayes
cmggszckc0003s60h7shbk9oz	carla.poirier@shopify.com	carla.poirier	https://www.gravatar.com/avatar/6f5f30083be43f9de1d8b369fcaef385	carla.poirier
cmi95y9g4000qs60h8bk6qx6s	steph.shin@shopify.com	steph.shin	https://www.gravatar.com/avatar/1bf67ac9d31a966b823aa1c4d4570799	steph.shin
cmebuucyf003ls60hruelxsf1	sarah.pyo@shopify.com	sarah.pyo	https://www.gravatar.com/avatar/b923c8403ec057fac7d800e0fe7d058d	sarah.pyo
cmebuurbe003rs60hgpzdac3x	kun.chen@shopify.com	kun.chen	https://www.gravatar.com/avatar/93158eebf158882599fd032ed0890021	kun.chen
cmebuurj9003ss60hpchu94ni	paddy.obrien@shopify.com	paddy.obrien	https://www.gravatar.com/avatar/fc76151b2324a400e9f042f54a4fbe2a	paddy.obrien
cmebw1uok001cs60h4aue3coy	rick.caplan@shopify.com	rick.caplan	https://www.gravatar.com/avatar/6e536491fcbba6e4bdbfad133cf41cc6	rick.caplan
cmecjr2xe0001s60hldc9a4sv	jason.paidoussi@shopify.com	jason.paidoussi	https://www.gravatar.com/avatar/5a8420ba25cc137b72ddb2d469ac286a	jason.paidoussi
cmecw7ukx0006s60hqqgzer8t	john.cole@shopify.com	john.cole	https://www.gravatar.com/avatar/564f476c62380653895e20659b5bd44f	john.cole
cmegbv5e10000s60hczsv3mhr	caleb.lee@shopify.com	caleb.lee	https://www.gravatar.com/avatar/059748a2f868e2337c284afedf42ff47	caleb.lee
cmek3djdt0000s60hgota3l0t	maksim.karalevich@shopify.com	maksim.karalevich	https://www.gravatar.com/avatar/0d71174a54f8730a32913a7020fa044e	maksim.karalevich
cmfbbpngr0001s60hjtpy1grt	meghan.ciliberti@shopify.com	meghan.ciliberti	https://www.gravatar.com/avatar/3e06659ed010ff366124420b28889146	meghan.ciliberti
cmg10apg20006s60h7t9zm2l3	kyle.petroski@shopify.com	kyle.petroski	https://www.gravatar.com/avatar/c8b0bd67be49446d7c8d8f5d2a7392c9	kyle.petroski
cmggvyt820000s60h8hju9v2n	mike.averto@shopify.com	mike.averto	https://www.gravatar.com/avatar/f088dc89fa9a71fdeb7cfb23f3a000f2	mike.averto
cmi97410h000us60hbk81woyy	sophie.schneider@shopify.com	sophie.schneider	https://www.gravatar.com/avatar/546c15addf4ca64280c414ae9cc602d6	sophie.schneider
cmebuuely003ms60hfvn0zp4k	sneha.namdeo@shopify.com	sneha.namdeo	https://www.gravatar.com/avatar/8fa9f4d6f27dc6792beaeb1e66231402	sneha.namdeo
cmebw1xud001ds60hcrzkt8m0	jason.blickhan@shopify.com	jason.blickhan	https://www.gravatar.com/avatar/51c29fc411d2f87801736e1f0d39a99f	jason.blickhan
cmecju8cp0002s60hq2k88mvn	nuno.silva@shopify.com	nuno.silva	https://www.gravatar.com/avatar/6248c276263f39fd21f575aa9b5fa734	nuno.silva
cmecwbkar0007s60hxw44qewa	matthew.boyd@shopify.com	matthew.boyd	https://www.gravatar.com/avatar/0432e7ddb61e352f07c08d9366b3cccc	matthew.boyd
cmeh3fx4n0001s60htg0qu9qt	matthew.pegula@shopify.com	matthew.pegula	https://www.gravatar.com/avatar/a1912ac2097d2113e4d44551891012eb	matthew.pegula
cmeka7g500000s60h58o245oh	ashten.alexander@shopify.com	ashten.alexander	https://www.gravatar.com/avatar/57caf79376027ed320cc6abc3c4b573c	ashten.alexander
cmfbdfho10002s60ho6dolc5q	trevor.walker@shopify.com	trevor.walker	https://www.gravatar.com/avatar/218a3c2acc7f302cb4e0906560fe09fc	trevor.walker
cmg13htd20002s60h2qb9r0po	george.antonious@shopify.com	george.antonious	https://www.gravatar.com/avatar/27a533f87dfee85e958c9d02c571af59	george.antonious
cmggyw93s0000s60hae2qh6v4	caitlin.mullen@shopify.com	caitlin.mullen	https://www.gravatar.com/avatar/e4b78560f88dec413caa49c9e771f352	caitlin.mullen
cmi97em74000vs60hrecky6yy	lo.kim@shopify.com	lo.kim	https://www.gravatar.com/avatar/34d79db105f64cb7cbc531937f78065f	lo.kim
cmebuug8f003ns60hm8jvdwgp	pascal.deladurantaye@shopify.com	pascal.deladurantaye	https://www.gravatar.com/avatar/4abe4e3e3a09a85df0fc3152b232308c	pascal.deladurantaye
cmebuur4f003qs60h3shwkome	jesse.makort@shopify.com	jesse.makort	https://www.gravatar.com/avatar/bd7e715a016482a863612c92ae9b8354	jesse.makort
cmebuuvuq003us60h7lnm5cig	daniel.podgornikabramovici@shopify.com	daniel.podgornikabramovici	https://www.gravatar.com/avatar/a1040817a0673d5e0fb5e2283b612b71	daniel.podgornikabramovici
cmebw7x70001es60hsnc1ou41	jake.sanford@shopify.com	jake.sanford	https://www.gravatar.com/avatar/9dc84d95018feb5916c5691267151a12	jake.sanford
cmeckpj8p0000s60htmmuoiwe	roeland.vanhoute@shopify.com	roeland.vanhoute	https://www.gravatar.com/avatar/79e64e5d7f4fb1dfe88c72717982e6f9	roeland.vanhoute
cmeckqfhh0003s60hhys41b1u	michele.garzetti@shopify.com	michele.garzetti	https://www.gravatar.com/avatar/c57faba2045221b9891dad9d7125bfec	michele.garzetti
cmecwdfec0008s60hb3pf5ouz	dave.hedengren@shopify.com	dave.hedengren	https://www.gravatar.com/avatar/756a842b0be6133f744958159a4f2e58	dave.hedengren
cmekaip520001s60h8zxhs8rs	dan.ertman@shopify.com	dan.ertman	https://www.gravatar.com/avatar/f753c73398f49f02b480a7f42ce90861	dan.ertman
cmfbdsel10003s60hiqoedsi4	erina.wu@shopify.com	erina.wu	https://www.gravatar.com/avatar/c75f46e3981c3f6b35207ff585ad4db1	erina.wu
cmg13l7av0003s60hnue3perd	andrew.xu@shopify.com	andrew.xu	https://www.gravatar.com/avatar/ce1f909904faa1f511c7baf0b139e50f	andrew.xu
cmg13ld3d0004s60hy9sgbl3y	michael.hughes@shopify.com	michael.hughes	https://www.gravatar.com/avatar/18313d130756f43ac7f92146ecceed0e	michael.hughes
cm8f38ghk004fs60hbjmrl4r9	cole.derochie@shopify.com	cole.derochie	https://www.gravatar.com/avatar/4eb8d09ba8967a344de8d9c9c627d012	cole.derochie
cmid7q8dr0000s60ho91qzvu9	anthony.zukofsky@shopify.com	anthony.zukofsky	https://www.gravatar.com/avatar/1ea05645933742dfba072fa2900fd9c6	anthony.zukofsky
cmebuuh1s003os60h1qgzxprv	tom.reimer@shopify.com	tom.reimer	https://www.gravatar.com/avatar/114b887dd9b1251396295526e0bfdcb4	tom.reimer
cmebuuqxt003ps60hj7ahl338	levi.morales@shopify.com	levi.morales	https://www.gravatar.com/avatar/02ec5bdf299aa5f5520b4834ccc9085b	levi.morales
cmebuuz96003vs60hgribqgzq	brandon.szymanski@shopify.com	brandon.szymanski	https://www.gravatar.com/avatar/018a9f604e33293bcd5e29b07c4bce6c	brandon.szymanski
cmebuv6md003xs60hqau5j5u6	maryam.kaka@shopify.com	maryam.kaka	https://www.gravatar.com/avatar/dc6bd66ce45bd0e4759e4a5b2e0ac812	maryam.kaka
cmebuvx5c003zs60he1facotc	david.wolf@shopify.com	david.wolf	https://www.gravatar.com/avatar/dc4b2d7217bff655db9b3f26018ec2dd	david.wolf
cmebuvzw40040s60hwvkk6lp1	arnold.orantes@shopify.com	arnold.orantes	https://www.gravatar.com/avatar/76ce7fcd299489a69fc512d8cd84d3d9	arnold.orantes
cmebwb4qj001fs60hrk3sy3sa	carlos.pereira@shopify.com	carlos.pereira	https://www.gravatar.com/avatar/1179773135109c3c357d75a22b0afbe7	carlos.pereira
cmeckpuhf0001s60hcsztt0eo	fabian.engeln@shopify.com	fabian.engeln	https://www.gravatar.com/avatar/99594916d2319cdabc31b0c3b00a4bb0	fabian.engeln
cmeckpyvn0002s60hhmlkllkf	nikita.savinov@shopify.com	nikita.savinov	https://www.gravatar.com/avatar/160008eea35357451bb4f19f2f5dcce3	nikita.savinov
cmecwi5jp0009s60hpbtoqhpd	nick.zhang@shopify.com	nick.zhang	https://www.gravatar.com/avatar/ee87778f4d47ab58a6b8ce7bd06fa783	nick.zhang
cmeh44hiw0002s60hjjvhn4kj	jan.grodowski@shopify.com	jan.grodowski	https://www.gravatar.com/avatar/d8047398f3974303aa3bb7545cc8b370	jan.grodowski
cmeliu8pa0000s60h2yig7hxb	mattie.toia@shopify.com	mattie.toia	https://www.gravatar.com/avatar/86742bfb865758a1c5173cc2c2ed6aeb	mattie.toia
cmfbgwva60000s60hnv474zsr	michael.elfassy@shopify.com	michael.elfassy	https://www.gravatar.com/avatar/fc07a4c0a5c318dd59aec81ad4522752	michael.elfassy
cmg158cp40000s60hdsynjp01	yasmin.motahhary@shopify.com	yasmin.motahhary	https://www.gravatar.com/avatar/4e48d0a11f05582dc7f0d81032e5df2d	yasmin.motahhary
cmgych6b10000s60hh3evnyeg	ben.rajabi@shopify.com	ben.rajabi	https://www.gravatar.com/avatar/c91f7c923b486879d36db68161309e4a	ben.rajabi
cmebuv98d000ms60h25nlb92f	brent.faulkner@shopify.com	brent.faulkner	https://www.gravatar.com/avatar/3bfde6f2aa518c51be9d9d8ca63a2785	brent.faulkner
cmebuvs30000ns60hb4xsur3h	phil.shadlyn@shopify.com	phil.shadlyn	https://www.gravatar.com/avatar/07de55b57366d81c2042fae23612d1e5	phil.shadlyn
cmebuw1nu0000s60h2r2srrkq	nikita.ali@shopify.com	nikita.ali	https://www.gravatar.com/avatar/509a4556eb203b4b07a731e6ef36cccb	nikita.ali
cmebuwckf000os60hqdvn29pr	marc.dobbelsteen@shopify.com	marc.dobbelsteen	https://www.gravatar.com/avatar/b3fb4398608f5ab7dc5844bbecd5e768	marc.dobbelsteen
cmebuwlpn000qs60hhed41i28	kasti.joshi@shopify.com	kasti.joshi	https://www.gravatar.com/avatar/c2891f51076d4fd4f378efbbca9c8676	kasti.joshi
cmebuxwko0006s60hsk63nmxy	nikita.vasilevsky@shopify.com	nikita.vasilevsky	https://www.gravatar.com/avatar/0abbe1d7d188dd6cb71312eda07ab2c7	nikita.vasilevsky
cmebuy8kr0008s60hw4ooomyd	matt.bowen@shopify.com	matt.bowen	https://www.gravatar.com/avatar/92acd0f621f98eef177a6a68ba07c2ec	matt.bowen
cmebv06sj000fs60hcc3qlucl	jay.gohil@shopify.com	Drevo	https://www.gravatar.com/avatar/042e9bb7d7618e4a77e5300009551592	jay.gohil
cmebwcg54001gs60hjenp0tzg	simon.lacoursiere@shopify.com	simon.lacoursiere	https://www.gravatar.com/avatar/4705a87e8cb068ba0df1f5c8af26b6cf	simon.lacoursiere
cmecl6fue0004s60h4e547qro	amy.coyle@shopify.com	amy.coyle	https://www.gravatar.com/avatar/0ec82c36376416fbda0cf5500299071f	amy.coyle
cmecwynb3000as60hp5p5vsud	anarosa.paredes@shopify.com	anarosa.paredes	https://www.gravatar.com/avatar/66cb72d7587b746ca1ed4a2dfdb5726b	anarosa.paredes
cmeh4g5jj0003s60h3vbqwnw6	rodrigo.sanches@shopify.com	rodrigo.sanches	https://www.gravatar.com/avatar/daa245cf323532b9b96b0b3ec454c48e	rodrigo.sanches
cmelwdgh10000s60h1fwkh8k7	kaylynn.chong@shopify.com	kaylynn.chong	https://www.gravatar.com/avatar/1e299b5129b7447eab27b18db81fc322	kaylynn.chong
cmfbofm5k0000s60h37jmc34u	jeanphilippe.sauvageau@shopify.com	jeanphilippe.sauvageau	https://www.gravatar.com/avatar/eca597a7866d0ea7b2805d2899bc7028	jeanphilippe.sauvageau
cmh0oipgw0000s60hqwruhrm7	cat.groux@shopify.com	cat.groux	https://www.gravatar.com/avatar/03aa74562727098af7800cfcc2d0aece	cat.groux
cmg17bxfr0000s60hzi42vlms	brayden.petersen@shopify.com	Brayden Petersen	https://www.gravatar.com/avatar/95cde7bff426ea4ba70bb8a4301cc42d	brayden.petersen
cmebuw2kr000ms60osfqmbzby	alex.salas@shopify.com	alex.salas	https://www.gravatar.com/avatar/c6ab41d354b3e80e43657b5c090d54bc	alex.salas
cmebuw9dm000ns60o1mmkuy8s	anne.branchut@shopify.com	anne.branchut	https://www.gravatar.com/avatar/983c01f2766eb3531ce7a9edead42e49	anne.branchut
cmebuwduv000os60om36qnplx	jim.graham@shopify.com	jim.graham	https://www.gravatar.com/avatar/e732b4a47bb9926661c0a5d1e9775ea1	jim.graham
cmebuwe9n0001s60h5vhmgd9w	christie.finlayson@shopify.com	christie.finlayson	https://www.gravatar.com/avatar/c91b2a038dad39eb85eadeed71e1f119	christie.finlayson
cmebuxbx80003s60hvlrry6im	kahvi.patel@shopify.com	kahvi.patel	https://www.gravatar.com/avatar/173ec08a782f5cb7cd212c6abe7005a4	kahvi.patel
cmebuz604000as60hix865hrx	jesse.robles@shopify.com	jesse.robles	https://www.gravatar.com/avatar/938d0df6c93749d88941b9cd55a1917a	jesse.robles
cmebuzfmc000cs60hmbnwmr27	joy.ekuta@shopify.com	joy.ekuta	https://www.gravatar.com/avatar/46639f6167424efcb50cc4f0bfa14497	joy.ekuta
cmebuzrql000ds60h75zzf9zh	kurt.peters@shopify.com	kurt.peters	https://www.gravatar.com/avatar/ab002ef5940932fc63cb85094e5599b0	kurt.peters
cmebwd3lj001hs60hg0geuf92	dwayne.doshier@shopify.com	dwayne.doshier	https://www.gravatar.com/avatar/bae4e46c41cc91593272fda3ecfbbb2a	dwayne.doshier
cmecl7vnp0005s60hjc8g3sjz	fernando.araujo@shopify.com	fernando.araujo	https://www.gravatar.com/avatar/e2c4ce0de20a3e0b9d845801578ffbbc	fernando.araujo
cmecwzmjf000bs60hcmp2dpx9	olivia.hunter@shopify.com	olivia.hunter	https://www.gravatar.com/avatar/3e62e2137cd160a1e4e6fda2c5730292	olivia.hunter
cmeh7h6w30000s60h1tjecsq2	amber.english@shopify.com	amber.english	https://www.gravatar.com/avatar/b5fc24855ae8f586a69ba4e4945a7a14	amber.english
cmemrhxax0000s60h5qvycl9h	farhan.thawar@shopify.com	farhan.thawar	https://www.gravatar.com/avatar/7b298f654b21b40f97df8c35f7e08187	farhan.thawar
cmfcdouez0000s60h6awylmye	kia.hanly@shopify.com	kia.hanly	https://www.gravatar.com/avatar/4d8cee18cb61fffad1854b36e2e66fee	kia.hanly
cmg18fs1v0004s60hbq73d2pa	remi.vanhee@shopify.com	remi.vanhee	https://www.gravatar.com/avatar/5a3d1d16afde409c2c6170d0ec0f1c36	remi.vanhee
cmh3keec70000s60hqa6st12t	casandra.smith@shopify.com	casandra.smith	https://www.gravatar.com/avatar/f50291f4425efdcc3935da2fc04194ff	casandra.smith
cmebuwf5j000ps60hec5pt0qu	jeremy.debonet@shopify.com	jeremy.debonet	https://www.gravatar.com/avatar/036308caaad0a9fd927de60b41bed494	jeremy.debonet
cmebuwgpz0002s60hdj2tc1mm	connor.jones@shopify.com	connor.jones	https://www.gravatar.com/avatar/a048e939fa4ae5b94751ce4226a0f7c1	connor.jones
cmebuwngu000ps60ot575yqll	jennifer.wills@shopify.com	jennifer.wills	https://www.gravatar.com/avatar/415129473a263569af5bd2c0f93a875a	jennifer.wills
cmebux7el000rs60h1yib2f0o	sheldon.trees@shopify.com	sheldon.trees	https://www.gravatar.com/avatar/7612487d9f3ec78d02e0e6c8b58d4e93	sheldon.trees
cmebux8m2000ss60hneya95pn	nick.horton@shopify.com	nick.horton	https://www.gravatar.com/avatar/9e968e1172fe3288618cddd401ea1d09	nick.horton
cmebux9c5000ts60h5m3dvxuo	conor.carey@shopify.com	conor.carey	https://www.gravatar.com/avatar/9ecf0a2ec180c3740473184e612783e1	conor.carey
cmebuxa9p000us60hs0rf3v8m	margie.peskin@shopify.com	margie.peskin	https://www.gravatar.com/avatar/cb3adced252eda3365cb8742d46613e0	margie.peskin
cmebuxfbg0004s60hgs0t02mc	chris.sulymka@shopify.com	chris.sulymka	https://www.gravatar.com/avatar/9ec0a1dc62c2f7e572937c46e4e62bec	chris.sulymka
cmebuxhwo0005s60hp4e46ibe	jim.reynolds@shopify.com	jim.reynolds	https://www.gravatar.com/avatar/1ae467d57b1a1079dce41a037e223158	jim.reynolds
cmebuyc4j0009s60hehuxbz44	jake.anderson@shopify.com	jake.anderson	https://www.gravatar.com/avatar/5ea76264337603c5c91a595ba4a5436b	jake.anderson
cmebuzers000bs60hdqdwesrr	annelise.lynch@shopify.com	annelise.lynch	https://www.gravatar.com/avatar/8f2df997c8b8eca96baec80b6033c425	annelise.lynch
cmebv074y000gs60hptqunum0	susmitha.anandarao@shopify.com	susmitha.anandarao	https://www.gravatar.com/avatar/aaeadc4485e69672e25f976a7be1a293	susmitha.anandarao
cmebwea8j001is60hpbozjrwg	kyle.kozma@shopify.com	kyle.kozma	https://www.gravatar.com/avatar/61f4010841e27da2c9489bc4b696c8b1	kyle.kozma
cmebwfhg2001js60ht3dkubnz	dylan.j.smith@shopify.com	dylan.j.smith	https://www.gravatar.com/avatar/7be4a03ac70593a4d07fa71c111db9cd	dylan.j.smith
cmecla0jb0006s60h21jc339d	graham.a.scott@shopify.com	graham.a.scott	https://www.gravatar.com/avatar/e100ce5557fdeccdd2e1a304e3f31390	graham.a.scott
cmecxgvmt000cs60h2qsw8x8t	manal.hassan@shopify.com	manal.hassan	https://www.gravatar.com/avatar/d085db46ce6258abb6cda142e849e3e6	manal.hassan
cmeh82db40001s60hqlbpkvcv	anthony.thomas@shopify.com	anthony.thomas	https://www.gravatar.com/avatar/99add2bd0be500644592f2066f024b77	anthony.thomas
cmen10fab0000s60hlm20sy8u	julie.haynes@shopify.com	julie.haynes	https://www.gravatar.com/avatar/75abab0ea6614f195f415f4766baf1e0	julie.haynes
cmfcgac4z0000s60hsy7fvtlk	emma.schmid@shopify.com	emma.schmid	https://www.gravatar.com/avatar/2af012bf1b8d31cff60bfce616cd6c34	emma.schmid
cmg1a7i590000s60hycekymyj	thiago.magalhaes@shopify.com	thiago.magalhaes	https://www.gravatar.com/avatar/baf27da09a0b0b565f3ff7a4998675c3	thiago.magalhaes
cmhcldw1h0000s60ha2a6pukr	richard.poirier@shopify.com	richard.poirier	https://www.gravatar.com/avatar/e0812cbe3829ad7b840971c417c2a9d8	richard.poirier
cmebuxfv8000vs60htx74v81z	paul.springett@shopify.com	paul.springett	https://www.gravatar.com/avatar/96e0d88616c9cf96acebb5b937d782de	paul.springett
cmebuxyx40007s60hfv2vikab	tim.lombardo@shopify.com	tim.lombardo	https://www.gravatar.com/avatar/e2222299c53180050371d3fbcfc1d45c	tim.lombardo
cmebuy55p000ws60hdfbk30v4	david.park@shopify.com	david.park	https://www.gravatar.com/avatar/4a9e328f32bc3163dfbcd49e0bfd9136	david.park
cmebv05nk000es60hb842gkmu	yan.m.liang@shopify.com	yan.m.liang	https://www.gravatar.com/avatar/74e880fdbbe92696849e7cfb2397c5ff	yan.m.liang
cmebwg79y001ks60h1cri713g	nick.rempel@shopify.com	nick.rempel	https://www.gravatar.com/avatar/c14e66d3fa87d7da4087b94a5a9a75ec	nick.rempel
cmeclcdc30007s60h02di0p0p	kumar.mcmillan@shopify.com	kumar.mcmillan	https://www.gravatar.com/avatar/8976f8e171b63c5c78597461c9ba974c	kumar.mcmillan
cmecxltp8000ds60hyjh712yc	lily.salem@shopify.com	lily.salem	https://www.gravatar.com/avatar/8bf9ee7dd9c95ace077fe58db8766c00	lily.salem
cmeh8psj80002s60hwocvesqg	amber.lammers@shopify.com	amber.lammers	https://www.gravatar.com/avatar/e518235fa2b4c2578bd7438353d28fd0	amber.lammers
cmen6o9gf0000s60h9p5guk1w	jhey.tompkins@shopify.com	jhey.tompkins	https://www.gravatar.com/avatar/3b5c1f820006b327ead82641f3d5131a	jhey.tompkins
cmfd72z430000s60h3pq0aybg	a.chen@shopify.com	a.chen	https://www.gravatar.com/avatar/b72a07bfa2af9dfb5b037023d4e8ee85	a.chen
cmg1c2tpf0000s60hsttn1e1h	james.go@shopify.com	james.go	https://www.gravatar.com/avatar/9fc04cb948e3a86f67e77adea70b72b1	james.go
cmhdwduhu0000s60hwmfbnkwo	brianna.nguyen@shopify.com	brianna.nguyen	https://www.gravatar.com/avatar/022c9502d38fea8bdae934c34f19d4dc	brianna.nguyen
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
a69a514f-e3fc-4129-840b-eac72fcd4c56	d8c9175b621f7bf127dc66ba324d0272c344b2c67066b09cf3c7c2d57d0f9032	2025-02-05 20:55:31.558949+00	20250203214636_create_initial_schema	\N	\N	2025-02-05 20:55:31.498438+00	1
17a9fcd2-268e-4daa-bf68-099ae6dfc70a	5b73b752a857671334b260be8987cf08987bc63f779f5eab7f61fde3b4b56b0a	2025-02-05 20:55:31.591579+00	20250205193606_add_unique_display_name_constraint	\N	\N	2025-02-05 20:55:31.573944+00	1
05ac5174-8e41-454d-8f8f-8e30edcef7a0	9158bd79a416ebe4b5224ff3fb3e7910b3c425566194078fabe42b6f5f3c3f0a	2025-02-07 20:59:41.408632+00	20250207192436_change_comment_mentions_type	\N	\N	2025-02-07 20:59:41.363147+00	1
9fba0f06-ab41-4fdb-8805-2ea871e0c4f2	18214b4e6aa42443742c9ef3acba233b94b5a812930d6990ecc57ec2beb86795	2025-02-07 20:59:41.430758+00	20250207193501_add_post_mentions	\N	\N	2025-02-07 20:59:41.415408+00	1
fff6e10d-65eb-43f8-9865-0bf01a58270a	ef535829c7fe8f04a1f830d836a3fec260dd8ee7e9280df024ee5415b5053525	2025-02-26 21:27:47.106798+00	20250226194913_add_pinned_tag_model	\N	\N	2025-02-26 21:27:46.977029+00	1
d9c2680c-e572-4d4d-827e-b4e6a07513a9	b6ef143883f1db1fb20b28be5b39c961b38a179ab98f149d74706289522dc823	2025-02-27 22:38:09.28852+00	20250227212251_add_username_to_user_model	\N	\N	2025-02-27 22:38:09.217797+00	1
b060e32a-8097-41f0-8070-f728527aa08b	d321ec56c4fbcca5ea4cc63b2956eef00a959a27c151f9ed5888bdca83736005	2025-02-27 22:38:09.345319+00	20250227212657_make_username_field_non_null	\N	\N	2025-02-27 22:38:09.299981+00	1
b44d5ffb-aa09-4bd6-9c88-3685df47f86d	cb3de57e4bfa6c37cb3d0fc910137778a675b9f5e22b5d401c01d4731b277b87	2025-02-28 14:00:58.329556+00	20250228133943_set_user_photo_url	\N	\N	2025-02-28 14:00:58.289986+00	1
c195671f-8178-463d-9eb6-773d60706a28	9e3f7b8961e0766f86e4969eab72ea5e0ca3cbcddde09f74aab8ec45a772cc8b	2025-02-28 20:28:52.214129+00	20250228195102_add_comment_tag_field	\N	\N	2025-02-28 20:28:52.189542+00	1
846b94d0-bcc4-4fcd-97df-90de7c60be4b	0ac6b9e98782d32f143ddce2becfb9f446dff7ca74686dc18e166834be665188	2025-03-07 15:52:03.803511+00	20250307132810_add_case_insensitive_indexes_on_tags_columns	\N	\N	2025-03-07 15:52:03.704752+00	1
\.


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- Name: Media Media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT "Media_pkey" PRIMARY KEY (id);


--
-- Name: PinnedTag PinnedTag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PinnedTag"
    ADD CONSTRAINT "PinnedTag_pkey" PRIMARY KEY (id);


--
-- Name: Post Post_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: PinnedTag_tag_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PinnedTag_tag_key" ON public."PinnedTag" USING btree (tag);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: idx_comment_tags_lowercase; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comment_tags_lowercase ON public."Comment" USING gin (public.lower_array(tags));


--
-- Name: idx_post_tags_lowercase; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_tags_lowercase ON public."Post" USING gin (public.lower_array(tags));


--
-- Name: Comment Comment_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Comment Comment_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Media Media_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT "Media_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Post Post_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

REVOKE ALL ON SCHEMA public FROM cloudsqladmin;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO cloudsqlsuperuser;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- Name: FUNCTION pg_replication_origin_advance(text, pg_lsn); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_advance(text, pg_lsn) TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_create(text); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_create(text) TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_drop(text); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_drop(text) TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_oid(text); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_oid(text) TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_progress(text, boolean); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_progress(text, boolean) TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_session_is_setup(); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_is_setup() TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_session_progress(boolean); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_progress(boolean) TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_session_reset(); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_reset() TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_session_setup(text); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_session_setup(text) TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_xact_reset(); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_xact_reset() TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_replication_origin_xact_setup(pg_lsn, timestamp with time zone); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_replication_origin_xact_setup(pg_lsn, timestamp with time zone) TO cloudsqlsuperuser;


--
-- Name: FUNCTION pg_show_replication_origin_status(OUT local_id oid, OUT external_id text, OUT remote_lsn pg_lsn, OUT local_lsn pg_lsn); Type: ACL; Schema: pg_catalog; Owner: -
--

GRANT ALL ON FUNCTION pg_catalog.pg_show_replication_origin_status(OUT local_id oid, OUT external_id text, OUT remote_lsn pg_lsn, OUT local_lsn pg_lsn) TO cloudsqlsuperuser;


--
-- PostgreSQL database dump complete
--

\unrestrict nghl6gzySuLfm9EWTus3CXkBt1Zb10eoWrkMoql5ivyCaq73YA8XpX1qanChMvY

