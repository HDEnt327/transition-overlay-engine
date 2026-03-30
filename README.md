# transition-overlay-engine

a motion graphics engine for transition overlays in obs.

i don't know whether anyone will find this thing useful, but here we are.

the need for this tool (engine) comes from being able to create transitions between videos for "showcase livestreams".

often times *such livestreams* contain a transition between videos  (showcases) containing information such as a title, creators, and maybe an image.

while a still image added between a queue of videos in a video player would work, if we wanted a more fancy transition, traditionally, one may compose everything in video editing software, such as after effects, to create the transition and add the text on top and render one trasition for each video, which is a tedious job and limits animations to the playback field.

this tool (i might just call it TOE) will enable the ability to create something to the likes of a template, where preset animations will be played on a webpage, and the text can be replaced every time the page is refreshed. this webpage may be added to obs as a browser source to be used as a transition layer.

this engine aims to be an all-in-one solution to this, which includes creating the animated text and images, exporting templates, switching text, obs scripting and control. note that this does not include creating other visual effects such as the transition background or stinger effects. TOE aims just to be an overlay tool.

more is to come soon.
