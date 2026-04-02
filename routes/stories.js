import { corsHeaders } from '../lib/shared.js';
import { validateToken } from '../lib/shared.js';

export async function handleStories(path, request, env) {
  const url = new URL(request.url);
  const storyMatch = path.match(/^\/stories\/(\d+)$/);
  const chapterMatch = path.match(/^\/chapters\/(\d+)$/);
  const storyLikeMatch = path.match(/^\/stories\/(\d+)\/like$/);
  const storyBookmarkMatch = path.match(/^\/stories\/(\d+)\/bookmark$/);
  const storyChapterPostMatch = path.match(/^\/stories\/(\d+)\/chapters$/);
  const chapterInfoMatch = path.match(/^\/chapters\/(\d+)\/info$/);
  const storyCharactersMatch = path.match(/^\/stories\/(\d+)\/characters$/);
  const characterMatch = path.match(/^\/characters\/(\d+)$/);
  const chapterCharactersMatch = path.match(/^\/chapters\/(\d+)\/characters$/);
  const chapterCharacterDeleteMatch = path.match(/^\/chapters\/(\d+)\/characters\/(\d+)$/);
  const storyWorldMatch = path.match(/^\/stories\/(\d+)\/world$/);
  const storyBooksMatch = path.match(/^\/stories\/(\d+)\/books$/);
  const bookMatch = path.match(/^\/books\/(\d+)$/);
  const bookChaptersMatch = path.match(/^\/books\/(\d+)\/chapters$/);
  const bookChapterDeleteMatch = path.match(/^\/books\/(\d+)\/chapters\/(\d+)$/);

  if (path === '/stories' && request.method === 'GET') {
    try {
      const genre=url.searchParams.get('genre'), author=url.searchParams.get('author');
      let query="SELECT stories.*, users.name as author_name, (SELECT COUNT(*) FROM story_likes WHERE story_id=stories.id) as like_count, (SELECT COUNT(*) FROM chapters WHERE story_id=stories.id) as chapter_count FROM stories JOIN users ON stories.user_id=users.id WHERE stories.status='published'";
      const params=[];
      if (genre){query+=" AND stories.genre=?";params.push(genre);}
      if (author){query+=" AND stories.user_id=?";params.push(author);}
      query+=" ORDER BY stories.updated_at DESC LIMIT 50";
      const stories=await env.DB.prepare(query).bind(...params).all();
      return new Response(JSON.stringify({stories:stories.results}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (path === '/stories' && request.method === 'POST') {
    const user=await validateToken(request,env);
    if (!user||(user.role!=='creator'&&user.role!=='admin')) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const {title,description,genre,status}=await request.json();
      if (!title||title.length>100) return new Response(JSON.stringify({error:'Invalid title'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
      const res=await env.DB.prepare("INSERT INTO stories (user_id,title,description,genre,status) VALUES (?,?,?,?,?)").bind(user.id,title,description||'',genre||'General',status||'draft').run();
      return new Response(JSON.stringify({success:true,id:res.meta.last_row_id}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (path === '/my/stories' && request.method === 'GET') {
    const user=await validateToken(request,env);
    if (!user||(user.role!=='creator'&&user.role!=='admin')) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const stories=await env.DB.prepare("SELECT stories.*, (SELECT COUNT(*) FROM chapters WHERE story_id=stories.id) as chapter_count, (SELECT COUNT(*) FROM story_likes WHERE story_id=stories.id) as like_count FROM stories WHERE user_id=? ORDER BY updated_at DESC").bind(user.id).all();
      return new Response(JSON.stringify({stories:stories.results}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (path === '/user/bookmarks' && request.method === 'GET') {
    const user=await validateToken(request,env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const stories=await env.DB.prepare("SELECT stories.*, users.name as author_name, (SELECT COUNT(*) FROM story_likes WHERE story_id=stories.id) as like_count, (SELECT COUNT(*) FROM chapters WHERE story_id=stories.id) as chapter_count FROM story_bookmarks JOIN stories ON story_bookmarks.story_id=stories.id JOIN users ON stories.user_id=users.id WHERE story_bookmarks.user_id=? ORDER BY story_bookmarks.created_at DESC").bind(user.id).all();
      return new Response(JSON.stringify({stories:stories.results}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (storyMatch && request.method === 'GET') {
    try {
      const storyId=storyMatch[1];
      const story=await env.DB.prepare("SELECT stories.*, users.name as author_name, (SELECT COUNT(*) FROM story_likes WHERE story_id=stories.id) as like_count FROM stories JOIN users ON stories.user_id=users.id WHERE stories.id=?").bind(storyId).first();
      if (!story) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
      const user=await validateToken(request,env);
      if (story.status==='draft') { if (!user||(String(user.id)!==String(story.user_id)&&user.role!=='admin')) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}}); }
      const chapters=await env.DB.prepare("SELECT id,title,chapter_number,created_at FROM chapters WHERE story_id=? ORDER BY chapter_number ASC").bind(storyId).all();
      let is_bookmarked=false;
      if (user) { const bm=await env.DB.prepare("SELECT id FROM story_bookmarks WHERE story_id=? AND user_id=?").bind(storyId,user.id).first(); is_bookmarked=!!bm; }
      return new Response(JSON.stringify({story,chapters:chapters.results,is_bookmarked}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (storyMatch && request.method === 'PUT') {
    const user=await validateToken(request,env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const storyId=storyMatch[1];
      const story=await env.DB.prepare("SELECT user_id FROM stories WHERE id=?").bind(storyId).first();
      if (!story) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
      if (user.role!=='admin'&&String(story.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      const {title,description,genre,status}=await request.json();
      await env.DB.prepare("UPDATE stories SET title=?,description=?,genre=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(title,description,genre,status,storyId).run();
      return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (storyMatch && request.method === 'DELETE') {
    const user=await validateToken(request,env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const storyId=storyMatch[1];
      const story=await env.DB.prepare("SELECT user_id FROM stories WHERE id=?").bind(storyId).first();
      if (!story) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
      if (user.role!=='admin'&&String(story.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      await env.DB.prepare("DELETE FROM chapters WHERE story_id=?").bind(storyId).run();
      await env.DB.prepare("DELETE FROM story_likes WHERE story_id=?").bind(storyId).run();
      await env.DB.prepare("DELETE FROM story_bookmarks WHERE story_id=?").bind(storyId).run();
      await env.DB.prepare("DELETE FROM characters WHERE story_id=?").bind(storyId).run();
      await env.DB.prepare("DELETE FROM story_world WHERE story_id=?").bind(storyId).run();
      await env.DB.prepare("DELETE FROM books WHERE story_id=?").bind(storyId).run();
      await env.DB.prepare("DELETE FROM stories WHERE id=?").bind(storyId).run();
      return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (storyLikeMatch && request.method === 'POST') {
    const user=await validateToken(request,env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const storyId=storyLikeMatch[1];
      const existing=await env.DB.prepare("SELECT id FROM story_likes WHERE story_id=? AND user_id=?").bind(storyId,user.id).first();
      let liked=false;
      if (existing){await env.DB.prepare("DELETE FROM story_likes WHERE id=?").bind(existing.id).run();}
      else{await env.DB.prepare("INSERT INTO story_likes (story_id,user_id) VALUES (?,?)").bind(storyId,user.id).run();liked=true;}
      const count=await env.DB.prepare("SELECT COUNT(*) as count FROM story_likes WHERE story_id=?").bind(storyId).first();
      return new Response(JSON.stringify({liked,like_count:count.count}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (storyBookmarkMatch && request.method === 'POST') {
    const user=await validateToken(request,env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const storyId=storyBookmarkMatch[1];
      const existing=await env.DB.prepare("SELECT id FROM story_bookmarks WHERE story_id=? AND user_id=?").bind(storyId,user.id).first();
      let bookmarked=false;
      if (existing){await env.DB.prepare("DELETE FROM story_bookmarks WHERE id=?").bind(existing.id).run();}
      else{await env.DB.prepare("INSERT INTO story_bookmarks (story_id,user_id) VALUES (?,?)").bind(storyId,user.id).run();bookmarked=true;}
      return new Response(JSON.stringify({bookmarked}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (chapterMatch && request.method === 'GET') {
    try {
      const chapterId=chapterMatch[1];
      const chapter=await env.DB.prepare("SELECT chapters.*, stories.user_id as story_user_id, stories.status as story_status FROM chapters JOIN stories ON chapters.story_id=stories.id WHERE chapters.id=?").bind(chapterId).first();
      if (!chapter) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
      const user=await validateToken(request,env);
      if (chapter.story_status==='draft'){if (!user||(String(user.id)!==String(chapter.story_user_id)&&user.role!=='admin')) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});}
      const prev=await env.DB.prepare("SELECT id,title FROM chapters WHERE story_id=? AND chapter_number < ? ORDER BY chapter_number DESC LIMIT 1").bind(chapter.story_id,chapter.chapter_number).first();
      const next=await env.DB.prepare("SELECT id,title FROM chapters WHERE story_id=? AND chapter_number > ? ORDER BY chapter_number ASC LIMIT 1").bind(chapter.story_id,chapter.chapter_number).first();
      try{chapter.linked_notes=JSON.parse(chapter.linked_notes||'[]');}catch(e){chapter.linked_notes=[];}
      return new Response(JSON.stringify({chapter,prev,next}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (storyChapterPostMatch && request.method === 'POST') {
    const user=await validateToken(request,env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const storyId=storyChapterPostMatch[1];
      const owner=await env.DB.prepare("SELECT user_id FROM stories WHERE id=?").bind(storyId).first();
      if (!owner) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
      if (user.role!=='admin'&&String(owner.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      const {title,body,chapter_number}=await request.json();
      if (!title||!body) return new Response(JSON.stringify({error:'Missing fields'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
      let chapter_num=chapter_number;
      if (!chapter_num){const max=await env.DB.prepare("SELECT MAX(chapter_number) as max_num FROM chapters WHERE story_id=?").bind(storyId).first();chapter_num=(max?.max_num||0)+1;}
      const res=await env.DB.prepare("INSERT INTO chapters (story_id,title,body,chapter_number) VALUES (?,?,?,?)").bind(storyId,title,body,chapter_num).run();
      await env.DB.prepare("UPDATE stories SET updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(storyId).run();
      return new Response(JSON.stringify({success:true,id:res.meta.last_row_id}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (chapterMatch && request.method === 'PUT') {
    const user=await validateToken(request,env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const chapterId=chapterMatch[1];
      const owner=await env.DB.prepare("SELECT stories.user_id FROM chapters JOIN stories ON chapters.story_id=stories.id WHERE chapters.id=?").bind(chapterId).first();
      if (!owner) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
      if (user.role!=='admin'&&String(owner.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      const {title,body,chapter_number,linked_notes}=await request.json();
      await env.DB.prepare("UPDATE chapters SET title=?,body=?,chapter_number=?,linked_notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(title,body,chapter_number,JSON.stringify(linked_notes||[]),chapterId).run();
      return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (chapterMatch && request.method === 'DELETE') {
    const user=await validateToken(request,env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const chapterId=chapterMatch[1];
      const owner=await env.DB.prepare("SELECT stories.user_id FROM chapters JOIN stories ON chapters.story_id=stories.id WHERE chapters.id=?").bind(chapterId).first();
      if (!owner) return new Response(JSON.stringify({error:'Not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
      if (user.role!=='admin'&&String(owner.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      await env.DB.prepare("DELETE FROM chapters WHERE id=?").bind(chapterId).run();
      return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (chapterInfoMatch) {
    const chapterId=chapterInfoMatch[1];
    if (request.method==='GET') {
      try {
        const info=await env.DB.prepare("SELECT * FROM chapter_info WHERE chapter_id=?").bind(chapterId).first();
        return new Response(JSON.stringify(info||{main_idea:'',fundamental_theme:'',extended_synopsis:''}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }
    if (request.method==='POST') {
      const user=await validateToken(request,env);
      if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const chapter=await env.DB.prepare("SELECT story_id FROM chapters WHERE id=?").bind(chapterId).first();
        if (!chapter) return new Response(JSON.stringify({error:'Chapter not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
        const story=await env.DB.prepare("SELECT user_id FROM stories WHERE id=?").bind(chapter.story_id).first();
        if (user.role!=='admin'&&String(story.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
        const {main_idea,fundamental_theme,extended_synopsis}=await request.json();
        await env.DB.prepare("INSERT INTO chapter_info (chapter_id,main_idea,fundamental_theme,extended_synopsis) VALUES (?,?,?,?) ON CONFLICT(chapter_id) DO UPDATE SET main_idea=excluded.main_idea,fundamental_theme=excluded.fundamental_theme,extended_synopsis=excluded.extended_synopsis,updated_at=CURRENT_TIMESTAMP").bind(chapterId,main_idea||'',fundamental_theme||'',extended_synopsis||'').run();
        return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }
  }

  if (storyCharactersMatch) {
    const storyId=storyCharactersMatch[1];
    if (request.method==='GET') {
      try {
        const chars=await env.DB.prepare("SELECT * FROM characters WHERE story_id=? ORDER BY name ASC").bind(storyId).all();
        const parsed=(chars.results||[]).map(c=>({...c,linked_notes:(()=>{try{return JSON.parse(c.linked_notes||'{}');}catch(e){return {};}})()}));
        return new Response(JSON.stringify({characters:parsed}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }
    if (request.method==='POST') {
      const user=await validateToken(request,env);
      if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const story=await env.DB.prepare("SELECT user_id FROM stories WHERE id=?").bind(storyId).first();
        if (!story) return new Response(JSON.stringify({error:'Story not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
        if (user.role!=='admin'&&String(story.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
        const {name,age,description,hobbies,backstory,personality,motivations,relationships}=await request.json();
        if (!name) return new Response(JSON.stringify({error:'Name is required'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
        const result=await env.DB.prepare("INSERT INTO characters (story_id,name,age,description,hobbies,backstory,personality,motivations,relationships) VALUES (?,?,?,?,?,?,?,?,?)").bind(storyId,name,age||'',description||'',hobbies||'',backstory||'',personality||'',motivations||'',relationships||'').run();
        return new Response(JSON.stringify({success:true,id:result.meta?.last_row_id}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }
  }

  if (characterMatch) {
    const charId=characterMatch[1];
    const user=await validateToken(request,env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const character=await env.DB.prepare("SELECT story_id FROM characters WHERE id=?").bind(charId).first();
      if (!character) return new Response(JSON.stringify({error:'Character not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
      const story=await env.DB.prepare("SELECT user_id FROM stories WHERE id=?").bind(character.story_id).first();
      if (user.role!=='admin'&&String(story.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      if (request.method==='PUT') {
        const {name,age,description,hobbies,backstory,personality,motivations,relationships,linked_notes}=await request.json();
        await env.DB.prepare("UPDATE characters SET name=?,age=?,description=?,hobbies=?,backstory=?,personality=?,motivations=?,relationships=?,linked_notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(name,age||'',description||'',hobbies||'',backstory||'',personality||'',motivations||'',relationships||'',JSON.stringify(linked_notes||{}),charId).run();
        return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      }
      if (request.method==='DELETE') {
        await env.DB.prepare("DELETE FROM chapter_characters WHERE character_id=?").bind(charId).run();
        await env.DB.prepare("DELETE FROM characters WHERE id=?").bind(charId).run();
        return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      }
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (chapterCharactersMatch) {
    const chapterId=chapterCharactersMatch[1];
    if (request.method==='GET') {
      try {
        const chars=await env.DB.prepare("SELECT characters.* FROM characters JOIN chapter_characters ON characters.id=chapter_characters.character_id WHERE chapter_characters.chapter_id=? ORDER BY characters.name ASC").bind(chapterId).all();
        return new Response(JSON.stringify({characters:chars.results}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }
    if (request.method==='POST') {
      const user=await validateToken(request,env);
      if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const chapter=await env.DB.prepare("SELECT story_id FROM chapters WHERE id=?").bind(chapterId).first();
        const story=await env.DB.prepare("SELECT user_id FROM stories WHERE id=?").bind(chapter.story_id).first();
        if (user.role!=='admin'&&String(story.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
        const {character_id}=await request.json();
        await env.DB.prepare("INSERT OR IGNORE INTO chapter_characters (chapter_id,character_id) VALUES (?,?)").bind(chapterId,character_id).run();
        return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }
  }

  if (chapterCharacterDeleteMatch && request.method==='DELETE') {
    const chapterId=chapterCharacterDeleteMatch[1], charId=chapterCharacterDeleteMatch[2];
    const user=await validateToken(request,env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const chapter=await env.DB.prepare("SELECT story_id FROM chapters WHERE id=?").bind(chapterId).first();
      const story=await env.DB.prepare("SELECT user_id FROM stories WHERE id=?").bind(chapter.story_id).first();
      if (user.role!=='admin'&&String(story.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      await env.DB.prepare("DELETE FROM chapter_characters WHERE chapter_id=? AND character_id=?").bind(chapterId,charId).run();
      return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (storyWorldMatch) {
    const storyId=storyWorldMatch[1];
    if (request.method==='GET') {
      try {
        const world=await env.DB.prepare("SELECT fields FROM story_world WHERE story_id=?").bind(storyId).first();
        let fields=[];
        if (world&&world.fields){try{fields=JSON.parse(world.fields);}catch(e){fields=[];}}
        return new Response(JSON.stringify({fields}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }
    if (request.method==='POST') {
      const user=await validateToken(request,env);
      if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const story=await env.DB.prepare("SELECT user_id FROM stories WHERE id=?").bind(storyId).first();
        if (!story) return new Response(JSON.stringify({error:'Story not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
        if (user.role!=='admin'&&String(story.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
        const {fields}=await request.json();
        if (!Array.isArray(fields)) return new Response(JSON.stringify({error:'fields must be an array'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
        await env.DB.prepare("INSERT INTO story_world (story_id,fields) VALUES (?,?) ON CONFLICT(story_id) DO UPDATE SET fields=excluded.fields,updated_at=CURRENT_TIMESTAMP").bind(storyId,JSON.stringify(fields)).run();
        return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }
  }

  if (storyBooksMatch) {
    const storyId=storyBooksMatch[1];
    if (request.method==='GET') {
      try {
        const books=await env.DB.prepare("SELECT * FROM books WHERE story_id=? ORDER BY sort_order ASC").bind(storyId).all();
        const results=[];
        for (const book of books.results){
          const chapters=await env.DB.prepare("SELECT chapters.id as chapter_id,chapters.title,chapters.chapter_number,book_chapters.sequence_order FROM chapters JOIN book_chapters ON chapters.id=book_chapters.chapter_id WHERE book_chapters.book_id=? ORDER BY book_chapters.sequence_order ASC").bind(book.id).all();
          book.chapters=chapters.results; results.push(book);
        }
        return new Response(JSON.stringify({books:results}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }
    if (request.method==='POST') {
      const user=await validateToken(request,env);
      if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
      try {
        const story=await env.DB.prepare("SELECT user_id FROM stories WHERE id=?").bind(storyId).first();
        if (user.role!=='admin'&&String(story.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
        const {name,description,sort_order}=await request.json();
        if (!name) return new Response(JSON.stringify({error:'Name is required'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
        const result=await env.DB.prepare("INSERT INTO books (story_id,name,description,sort_order) VALUES (?,?,?,?)").bind(storyId,name,description||'',sort_order||0).run();
        return new Response(JSON.stringify({success:true,id:result.meta?.last_row_id}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
    }
  }

  if (bookMatch) {
    const bookId=bookMatch[1];
    const user=await validateToken(request,env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const book=await env.DB.prepare("SELECT story_id FROM books WHERE id=?").bind(bookId).first();
      if (!book) return new Response(JSON.stringify({error:'Book not found'}),{status:404,headers:{...corsHeaders,'Content-Type':'application/json'}});
      const story=await env.DB.prepare("SELECT user_id FROM stories WHERE id=?").bind(book.story_id).first();
      if (user.role!=='admin'&&String(story.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      if (request.method==='PUT'){
        const {name,description,sort_order}=await request.json();
        await env.DB.prepare("UPDATE books SET name=?,description=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(name,description||'',sort_order||0,bookId).run();
        return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      }
      if (request.method==='DELETE'){
        await env.DB.prepare("DELETE FROM book_chapters WHERE book_id=?").bind(bookId).run();
        await env.DB.prepare("DELETE FROM books WHERE id=?").bind(bookId).run();
        return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
      }
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (bookChaptersMatch && request.method==='POST') {
    const bookId=bookChaptersMatch[1];
    const user=await validateToken(request,env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const book=await env.DB.prepare("SELECT story_id FROM books WHERE id=?").bind(bookId).first();
      const story=await env.DB.prepare("SELECT user_id FROM stories WHERE id=?").bind(book.story_id).first();
      if (user.role!=='admin'&&String(story.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      const {chapter_id,sequence_order}=await request.json();
      const chapter=await env.DB.prepare("SELECT story_id FROM chapters WHERE id=?").bind(chapter_id).first();
      if (!chapter||String(chapter.story_id)!==String(book.story_id)) return new Response(JSON.stringify({error:'Invalid chapter'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}});
      await env.DB.prepare("INSERT OR IGNORE INTO book_chapters (book_id,chapter_id,sequence_order) VALUES (?,?,?)").bind(bookId,chapter_id,sequence_order||0).run();
      return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  if (bookChapterDeleteMatch && request.method==='DELETE') {
    const bookId=bookChapterDeleteMatch[1], chapterId=bookChapterDeleteMatch[2];
    const user=await validateToken(request,env);
    if (!user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    try {
      const book=await env.DB.prepare("SELECT story_id FROM books WHERE id=?").bind(bookId).first();
      const story=await env.DB.prepare("SELECT user_id FROM stories WHERE id=?").bind(book.story_id).first();
      if (user.role!=='admin'&&String(story.user_id)!==String(user.id)) return new Response(JSON.stringify({error:'Forbidden'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
      await env.DB.prepare("DELETE FROM book_chapters WHERE book_id=? AND chapter_id=?").bind(bookId,chapterId).run();
      return new Response(JSON.stringify({success:true}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
    } catch(e){return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});}
  }

  return null;
}
